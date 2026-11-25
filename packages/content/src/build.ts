import { createHash } from "node:crypto";
import path from "node:path";
import type { Bundle, BundleTrack } from "./bundle.ts";
import { loadTrackChapters } from "./chapters.ts";
import { loadTrackFacts } from "./load.ts";
import { canonicalJson } from "./values.ts";
import {
  bundleTrack,
  checkVersions,
  readVersions,
  trackItems,
  VERSIONS_FILE,
} from "./versions.ts";
import { type Problem, subfolders } from "./yaml-file.ts";

/** Folders in `content/` that aren't tracks, like private reference material */
export const NOT_TRACKS = new Set(["resources"]);

export type BuildResult = {
  /** Only built when there are no problems */
  bundle: Bundle | undefined;
  problems: Problem[];
};

/**
 * Checks every track in a content folder, with its facts, chapters, rubrics,
 * and recorded versions, and builds the bundle learners get. Tracks with no
 * chapters yet are checked but left out.
 */
export async function buildBundle(contentDir: string): Promise<BuildResult> {
  const problems: Problem[] = [];
  const tracks: { order: number; build: () => BundleTrack }[] = [];

  for (const folder of await subfolders(contentDir)) {
    if (NOT_TRACKS.has(folder)) continue;
    const trackDir = path.join(contentDir, folder);
    problems.push(...(await loadTrackFacts(trackDir)).problems);
    const loaded = await loadTrackChapters(trackDir);
    problems.push(...loaded.problems);
    const { track, chapters, rubrics } = loaded;
    if (!track) continue;

    const versions = await readVersions(
      path.join(trackDir, VERSIONS_FILE),
      problems,
    );
    checkVersions(trackItems(chapters, rubrics), versions, problems);
    tracks.push({
      order: track.order ?? Number.POSITIVE_INFINITY,
      build: () => bundleTrack(track, chapters, rubrics, versions),
    });
  }

  if (problems.length > 0) return { bundle: undefined, problems };
  // Folders come sorted by name, and the sort is stable, so ties keep that order
  const built = tracks
    .sort((a, b) => (a.order === b.order ? 0 : a.order - b.order))
    .map((track) => track.build());
  const hash = createHash("sha256").update(canonicalJson(built)).digest("hex");
  return { bundle: { hash, tracks: built }, problems };
}
