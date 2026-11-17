import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadTrackChapters } from "./chapters.ts";
import { formatProblem, loadTrackFacts } from "./load.ts";
import { subfolders } from "./yaml-file.ts";

const contentDir = fileURLToPath(new URL("../../../content/", import.meta.url));

// Private reference material, never committed
const NOT_TRACKS = new Set(["resources"]);

describe("content", () => {
  it("has no problems in the Stack decisions facts", async () => {
    const { problems } = await loadTrackFacts(`${contentDir}stack-decisions`);
    expect(problems.map((problem) => formatProblem(problem))).toEqual([]);
  });

  it("has no problems in any track's chapters", async () => {
    const problems: string[] = [];
    for (const folder of await subfolders(contentDir)) {
      if (NOT_TRACKS.has(folder)) continue;
      const loaded = await loadTrackChapters(path.join(contentDir, folder));
      problems.push(
        ...loaded.problems.map((problem) => formatProblem(problem)),
      );
    }
    expect(problems).toEqual([]);
  });
});
