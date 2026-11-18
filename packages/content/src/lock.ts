import { writeFile } from "node:fs/promises";
import path from "node:path";
import { addToLock, LOCK_FILE, readCases, readLock } from "./test-cases.ts";
import { type Problem, subfolders } from "./yaml-file.ts";

export type LockResult = {
  /** Lock files that gained hashes, with how many */
  written: { file: string; added: number }[];
  /** Lock files left alone because they couldn't be read */
  problems: Problem[];
};

/**
 * Adds hashes for new cases in every exercise of a track. Existing hashes are
 * never changed, so a changed case still fails the content check.
 */
export async function lockTrack(trackDir: string): Promise<LockResult> {
  const result: LockResult = { written: [], problems: [] };
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
  return result;
}
