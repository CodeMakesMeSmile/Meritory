import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { BundleCodingExercise } from "@meritory/content";
import { buildBundle } from "@meritory/content/node";
import { beforeAll, describe, expect, it } from "vitest";
import {
  type BundleCase,
  casesToRun,
  collectResults,
  type Language,
  runCode,
} from "./run.ts";
import { directSandbox } from "./sandbox.ts";

const CONTENT = fileURLToPath(new URL("../../../content/", import.meta.url));
const SOLUTION: Record<Language, string> = {
  typescript: "solution.ts",
  python: "solution.py",
};

interface Found {
  path: string;
  exercise: BundleCodingExercise;
}

let coding: Found[] = [];

beforeAll(async () => {
  const { bundle } = await buildBundle(CONTENT);
  if (!bundle) throw new Error("The content didn't build");
  coding = bundle.tracks.flatMap((track) =>
    track.chapters.flatMap((chapter) =>
      chapter.exercises
        .filter((e): e is BundleCodingExercise => e.kind === "coding")
        .map((exercise) => ({
          path: `${CONTENT}${track.id}/chapters/${chapter.id}/exercises/${exercise.id}/solutions/`,
          exercise,
        })),
    ),
  );
}, 60000);

const sandbox = directSandbox();

function request(
  exercise: BundleCodingExercise,
  language: Language,
  code: string,
) {
  return {
    language,
    code,
    signature: exercise.signature as Record<string, unknown>,
    cases: exercise.cases as BundleCase[],
  };
}

describe.each(["typescript", "python"] as const)("%s harness", (language) => {
  it("passes every reference solution on every case", async () => {
    expect(coding.length).toBeGreaterThan(0);
    for (const { path, exercise } of coding) {
      const code = await readFile(`${path}${SOLUTION[language]}`, "utf8");
      const result = await runCode(request(exercise, language, code), sandbox);
      const failed = result.tests.filter((t) => t.status !== "pass");
      expect({
        exercise: exercise.id,
        status: result.status,
        message: result.message,
        failed,
      }).toEqual({
        exercise: exercise.id,
        status: "pass",
        message: undefined,
        failed: [],
      });
      expect(result.tests.length).toBe(
        casesToRun(exercise.cases as BundleCase[]).length,
      );
    }
  }, 120000);
});

const pricePair = () => {
  const found = coding.find((c) => c.exercise.id === "price-pair");
  if (!found) throw new Error("price-pair is missing");
  return found.exercise;
};

const WRONG: Record<Language, string> = {
  typescript:
    "export function pricePair(prices: number[], target: number): number[] { return [0, 0]; }",
  python:
    "class Solution:\n    def pricePair(self, prices, target):\n        return [0, 0]\n",
};
const THROWS: Record<Language, string> = {
  typescript:
    'export function pricePair(): number[] { throw new RangeError("nope"); }',
  python:
    "class Solution:\n    def pricePair(self, prices, target):\n        raise ValueError('nope')\n",
};
const ENDLESS: Record<Language, string> = {
  typescript: "export function pricePair(): number[] { for (;;) {} }",
  python:
    "class Solution:\n    def pricePair(self, prices, target):\n        while True:\n            pass\n",
};
const BROKEN: Record<Language, string> = {
  typescript: "export function pricePair( {",
  python: "class Solution:\n    def pricePair(self\n",
};
const MISNAMED: Record<Language, string> = {
  typescript: "export function somethingElse() { return []; }",
  python: "class Solution:\n    def somethingElse(self):\n        return []\n",
};

describe.each(["typescript", "python"] as const)(
  "%s answers that miss",
  (language) => {
    it("shows what was expected and what came back", async () => {
      const result = await runCode(
        request(pricePair(), language, WRONG[language]),
        sandbox,
      );
      expect(result.status).toBe("fail");
      const failed = result.tests.find((t) => t.status === "fail");
      expect(failed?.message).toMatch(/^Expected \[.*\] but got \[0,0\]$/);
    });

    it("reports a thrown error per case", async () => {
      const result = await runCode(
        request(pricePair(), language, THROWS[language]),
        sandbox,
      );
      expect(result.status).toBe("error");
      expect(result.tests[0]?.message).toMatch(/nope/);
    });

    it("stops a loop that never ends and marks the rest as not run", async () => {
      const quick = directSandbox(1500);
      const result = await runCode(
        request(pricePair(), language, ENDLESS[language]),
        quick,
      );
      expect(result.status).toBe("error");
      expect(result.tests[0]?.message).toMatch(/Took too long/);
      expect(result.tests[1]?.message).toMatch(/Didn't run/);
    }, 20000);

    it("explains code that doesn't load", async () => {
      const result = await runCode(
        request(pricePair(), language, BROKEN[language]),
        sandbox,
      );
      expect(result.status).toBe("error");
      expect(result.tests).toEqual([]);
      expect(result.message).toMatch(/SyntaxError/);
    });

    it("says when the function is missing", async () => {
      const result = await runCode(
        request(pricePair(), language, MISNAMED[language]),
        sandbox,
      );
      expect(result.status).toBe("error");
      expect(result.tests[0]?.message).toMatch(
        /^solution.(ts|py) doesn't (export|define) a (function|Solution method) named pricePair$/,
      );
    });
  },
);

describe("casesToRun", () => {
  const base = { input: {}, expected: 1 };
  it("leaves out replaced cases and numbers repeated names", () => {
    const cases = [
      { uuid: "a", description: "same", ...base },
      { uuid: "b", description: "same", ...base },
      { uuid: "c", description: "old", ...base },
      { uuid: "d", description: "new", reimplements: "c", ...base },
    ];
    expect(casesToRun(cases).map((c) => c.name)).toEqual([
      "same",
      "same (2)",
      "new",
    ]);
  });
});

describe("collectResults", () => {
  it("caps long messages and ignores lines that aren't results", () => {
    const long = "x".repeat(800);
    const lines = [
      "not json",
      JSON.stringify({ name: "one", status: "started" }),
      JSON.stringify({ name: "one", status: "fail", message: long }),
    ].join("\n");
    const result = collectResults(["one"], lines, { kind: "ok", stderr: "" });
    expect(result.tests[0]?.message).toHaveLength(500);
    expect(result.status).toBe("fail");
  });

  it("names the memory limit for the case that hit it", () => {
    const lines = JSON.stringify({ name: "one", status: "started" });
    const result = collectResults(["one", "two"], lines, {
      kind: "memory",
      stderr: "",
    });
    expect(result.tests.map((t) => t.message)).toEqual([
      "Used too much memory, so it was stopped.",
      "Didn't run, because an earlier case stopped the run.",
    ]);
  });
});
