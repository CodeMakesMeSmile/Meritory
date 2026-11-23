import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadTrackChapters } from "./chapters.ts";
import { addToLock, LOCK_FILE, readCases, readLock } from "./test-cases.ts";
import {
  addVersions,
  checkCardChapters,
  readVersions,
  trackItems,
  VERSIONS_FILE,
} from "./versions.ts";
import { type Problem, subfolders } from "./yaml-file.ts";

/** A file that gained entries, with how many */
export type Written = { file: string; added: number };

export type LockResult = {
  /** Lock files that gained case hashes */
  written: Written[];
  /** The versions file, when items gained versions */
  versions: Written[];
  /** The versions file, when cards had their chapters recorded */
  chapters: Written[];
  /** Files left alone, and why */
  problems: Problem[];
};

/**
 * Adds hashes for new cases in every exercise of a track, then records a new
 * version for every item that changed. Existing hashes are never changed, so
 * a changed case still fails the content check.
 */
export async function lockTrack(trackDir: string): Promise<LockResult> {
  const result: LockResult = {
    written: [],
    versions: [],
    chapters: [],
    problems: [],
  };
  const chaptersDir = path.join(trackDir, "chapters");
  for (const chapter of await subfolders(chaptersDir)) {
    const exercisesDir = path.join(chaptersDir, chapter, "exercises");
    for (const exercise of await subfolders(exercisesDir)) {
      const dir = path.join(exercisesDir, exercise);
      // The content check reports problems in the cases themselves
      const cases = await readCases(path.join(dir, "cases.json"), exercise, []);
      if (!cases || cases.length === 0) continue;

      const file = path.join(dir, LOCK_FILE);
      const lockProblems: Problem[] = [];
      const lock = await readLock(file, lockProblems);
      if (lockProblems.length > 0) {
        result.problems.push(...lockProblems);
        continue;
      }
      const next = addToLock(lock, cases);
      if (next.added === 0) continue;
      await writeFile(file, `${JSON.stringify(next.lock, null, 2)}\n`);
      result.written.push({ file, added: next.added });
    }
  }
  await recordVersions(trackDir, result);
  return result;
}

async function recordVersions(trackDir: string, result: LockResult) {
  const { track, chapters, rubrics, problems } =
    await loadTrackChapters(trackDir);
  if (!track && problems.length === 0) return;
  const file = path.join(trackDir, VERSIONS_FILE);
  // A version of content with problems would never be served
  if (problems.length > 0) {
    result.problems.push({
      file,
      line: null,
      message: "can't record versions while the track has problems",
    });
    return;
  }
  const versionProblems: Problem[] = [];
  const versions = await readVersions(file, versionProblems);
  if (versionProblems.length > 0) {
    result.problems.push(...versionProblems);
    return;
  }
  const items = trackItems(chapters, rubrics);
  const moved: Problem[] = [];
  checkCardChapters(items, versions, moved);
  if (moved.length > 0) {
    result.problems.push(...moved);
    return;
  }
  const next = addVersions(versions, items);
  if (next.added === 0 && next.placed === 0) return;
  await writeFile(file, versionsJson(next.versions));
  if (next.added > 0) result.versions.push({ file, added: next.added });
  if (next.placed > 0) result.chapters.push({ file, added: next.placed });
}

const LINE_WIDTH = 80;

/** Laid out the way Biome formats it, so a fresh lock passes lint */
export function versionsJson(versions: Record<string, string[]>): string {
  const keys = Object.keys(versions);
  const lines = keys.map((key, i) => {
    const comma = i < keys.length - 1 ? "," : "";
    const items = versions[key] ?? [];
    const name = `  ${JSON.stringify(key)}: `;
    const inline = `${name}[${items.map((item) => JSON.stringify(item)).join(", ")}]${comma}`;
    if (inline.length <= LINE_WIDTH) return inline;
    const rows = items.map(
      (item, j) =>
        `    ${JSON.stringify(item)}${j < items.length - 1 ? "," : ""}`,
    );
    return [`${name}[`, ...rows, `  ]${comma}`].join("\n");
  });
  return keys.length === 0 ? "{}\n" : `{\n${lines.join("\n")}\n}\n`;
}
