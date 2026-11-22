import { fileURLToPath } from "node:url";
import Value from "typebox/value";
import { describe, expect, it } from "vitest";
import { buildBundle } from "./build.ts";
import { Bundle } from "./bundle.ts";
import { formatProblem } from "./yaml-file.ts";

const contentDir = fileURLToPath(new URL("../../../content/", import.meta.url));

describe("content", () => {
  // Building the whole curriculum can take longer than one test's time limit when every file runs at once
  it("builds every track with no problems", async () => {
    const { bundle, problems } = await buildBundle(contentDir);
    expect(problems.map((problem) => formatProblem(problem))).toEqual([]);
    expect([...Value.Errors(Bundle, bundle)]).toEqual([]);
  }, 60000);
});
