import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildBundle } from "./build.ts";
import { formatProblem } from "./yaml-file.ts";

const contentDir = fileURLToPath(new URL("../../../content/", import.meta.url));

describe("content", () => {
  it("builds every track with no problems", async () => {
    const { problems } = await buildBundle(contentDir);
    expect(problems.map((problem) => formatProblem(problem))).toEqual([]);
  });
});
