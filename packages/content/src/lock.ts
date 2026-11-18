import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadTrackChapters } from "./chapters.ts";
import { addToLock, LOCK_FILE, readCases, readLock } from "./test-cases.ts";
import {
  addVersions,
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
  /** Files left alone, and why */
  problems: Problem[];
};

/**
 * Adds hashes for new cases in every exercise of a track, then records a new
 * version for every item that changed. Existing hashes are never changed, so
 * a changed case still fails the content check.
 */
export async function lockTrack(trackDir: string): Promise<LockResult> {
  const result: LockResult = { written: [], versions: [], problems: [] };
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
  const next = addVersions(versions, trackItems(chapters, rubrics));
  if (next.added === 0) return;
  await writeFile(file, `${JSON.stringify(next.versions, null, 2)}\n`);
  result.versions.push({ file, added: next.added });
}
