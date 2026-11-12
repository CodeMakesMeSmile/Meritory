import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatProblem, loadTrackFacts } from "./load.ts";

const contentDir = fileURLToPath(new URL("../../../content/", import.meta.url));

describe("content", () => {
  it("has no problems in the Stack decisions facts", async () => {
    const { problems } = await loadTrackFacts(`${contentDir}stack-decisions`);
    expect(problems.map((problem) => formatProblem(problem))).toEqual([]);
  });
});
