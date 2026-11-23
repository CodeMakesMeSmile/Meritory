import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { BundleCodingExercise } from "@meritory/content";
import { buildBundle } from "@meritory/content/node";
import { beforeAll, describe, expect, it } from "vitest";
import { readLine, show } from "./judge.ts";
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
// Writes a passing result for every case, then quits before the harness runs
const FORGED: Record<Language, string> = {
  typescript: [
    'import { appendFileSync, readFileSync } from "node:fs";',
    'const cases = JSON.parse(readFileSync("cases.json", "utf8"));',
    "for (const c of cases) {",
    '  for (const status of ["started", "pass", "done"]) {',
    '    appendFileSync("results.jsonl", JSON.stringify({ name: c.name, status, actual: c.expected ?? null }) + String.fromCharCode(10));',
    "  }",
    "}",
    "process.exit(0);",
    "export function pricePair(): number[] { return []; }",
  ].join("\n"),
  python: [
    "import json, os",
    'with open("cases.json") as f:',
    "    cases = json.load(f)",
    'with open("results.jsonl", "a") as out:',
    "    for c in cases:",
    '        for status in ("started", "pass", "done"):',
    '            out.write(json.dumps({"name": c["name"], "status": status, "actual": c.get("expected")}) + chr(10))',
    "os._exit(0)",
  ].join("\n"),
};
const MISNAMED: Record<Language, string> = {
  typescript: "export function somethingElse() { return []; }",
  python: "class Solution:\n    def somethingElse(self):\n        return []\n",
};
// Values JSON can't carry as they are, each with how the miss reads
const ODD: Record<Language, [string, string, RegExp][]> = {
  typescript: [
    [
      "NaN",
      "export function pricePair(): number[] { return [NaN, NaN]; }",
      /but got \[null,null\]$/,
    ],
    [
      "BigInt",
      "export function pricePair(): number[] { return [1n, 2n] as unknown as number[]; }",
      /but got 1,2$/,
    ],
    [
      "a cyclic list",
      "export function pricePair(): number[] { const a: unknown[] = []; a.push(a); return a as number[]; }",
      /^Expected \[.*\] but got$/,
    ],
  ],
  python: [
    [
      "NaN",
      "class Solution:\n    def pricePair(self, prices, target):\n        return [float('nan')]\n",
      /but got \[nan\]$/,
    ],
    [
      "a set",
      "class Solution:\n    def pricePair(self, prices, target):\n        return {1, 2}\n",
      /but got \{1, 2\}$/,
    ],
    [
      "a cyclic list",
      "class Solution:\n    def pricePair(self, prices, target):\n        a = []\n        a.append(a)\n        return a\n",
      /but got \[+\.\.\.\]+$/,
    ],
  ],
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

    it.each(ODD[language])("fails %s and shows it", async (_, code, shown) => {
      const result = await runCode(
        request(pricePair(), language, code),
        sandbox,
      );
      expect(result.status).toBe("fail");
      expect(result.tests.every((t) => t.status === "fail")).toBe(true);
      expect(result.tests[0]?.message).toMatch(shown);
    });

    it("can't pass by writing its own results", async () => {
      const result = await runCode(
        request(pricePair(), language, FORGED[language]),
        sandbox,
      );
      expect(result.status).toBe("fail");
      expect(result.tests.filter((t) => t.status === "pass")).toEqual([]);
      expect(result.tests[0]?.message).toMatch(
        /^Expected \[.*\] but got null$/,
      );
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

describe("show", () => {
  it("never throws, even on a value nested too deeply to print", () => {
    // JSON can't carry the BigInt, and String recurses through every level
    let deep: unknown = [1n];
    for (let i = 0; i < 1_000_000; i++) deep = [deep];
    expect(show(deep)).toBe("a value that can't be shown");
    expect(show(Object.create(null))).toBe("{}");
    expect(show([1, 2])).toBe("[1,2]");
  });
});

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
  const signature = { function: "f", params: [], returns: "int" };
  const one = [{ name: "one", input: {}, expected: 1 }];
  const two = [...one, { name: "two", input: {}, expected: 2 }];
  const line = (value: object) => JSON.stringify(value);

  it("caps long messages and ignores lines that aren't results", () => {
    const lines = [
      "not json",
      line({ name: "one", status: "started" }),
      line({ name: "one", status: "done", actual: "x".repeat(800) }),
    ].join("\n");
    const result = collectResults(one, signature, "typescript", lines, {
      kind: "ok",
      stderr: "",
    });
    expect(result.tests[0]?.message).toHaveLength(500);
    expect(result.status).toBe("fail");
  });

  it("names the memory limit for the case that hit it", () => {
    const lines = line({ name: "one", status: "started" });
    const result = collectResults(two, signature, "typescript", lines, {
      kind: "memory",
      stderr: "",
    });
    expect(result.tests.map((t) => t.message)).toEqual([
      "Used too much memory, so it was stopped.",
      "Didn't run, because an earlier case stopped the run.",
    ]);
  });

  it("ignores old-style verdicts and anything written before a case starts", () => {
    const lines = [
      line({ name: "one", status: "pass" }),
      line({ name: "one", status: "started" }),
      line({ name: "one", status: "pass" }),
    ].join("\n");
    const result = collectResults(one, signature, "typescript", lines, {
      kind: "ok",
      stderr: "",
    });
    expect(result.tests[0]?.status).toBe("error");
  });

  it("keeps Python's 2.0 apart from 2 unless the type is a double", () => {
    const lines = (actual: string) =>
      [
        line({ name: "one", status: "started" }),
        `{"name": "one", "status": "done", "actual": ${actual}}`,
      ].join("\n");
    const ok = { kind: "ok", stderr: "" } as const;
    const int = [{ name: "one", input: {}, expected: 2 }];
    expect(
      collectResults(int, signature, "python", lines("2.0"), ok).tests[0],
    ).toEqual({
      name: "one",
      status: "fail",
      message: "Expected 2 but got 2.0",
    });
    expect(
      collectResults(int, signature, "python", lines("2"), ok).status,
    ).toBe("pass");
    const double = { ...signature, returns: "double" };
    expect(
      collectResults(int, double, "python", lines("2.000001"), ok).status,
    ).toBe("pass");
    expect(readLine("[1e2]", false)).toEqual([100]);
  });

  it("passes a case that should throw only when it throws", () => {
    const refuse = [{ name: "one", input: {}, expected: { error: "bad" } }];
    const ending = (end: object) =>
      [
        line({ name: "one", status: "started" }),
        line({ name: "one", ...end }),
      ].join("\n");
    const ok = { kind: "ok", stderr: "" } as const;
    const threw = ending({ status: "threw", message: "RangeError: bad" });
    expect(
      collectResults(refuse, signature, "typescript", threw, ok).status,
    ).toBe("pass");
    expect(collectResults(one, signature, "typescript", threw, ok).status).toBe(
      "error",
    );
    const done = ending({ status: "done", actual: 5 });
    expect(
      collectResults(refuse, signature, "typescript", done, ok).tests[0]
        ?.message,
    ).toBe("Expected an error, but got 5");
  });

  describe("class cases", () => {
    const counter = {
      class: "Counter",
      params: [],
      methods: [
        { name: "add", params: [], returns: "void" },
        { name: "count", params: [], returns: "int" },
      ],
    };
    const cases = [
      {
        name: "one",
        input: { calls: ["Counter", "add", "count"], args: [[], [], []] },
        expected: [null, null, 1],
      },
    ];
    const run = (lines: object[], exit = "ok" as "ok" | "timeout") =>
      collectResults(cases, counter, "typescript", lines.map(line).join("\n"), {
        kind: exit,
        stderr: "",
      }).tests[0];
    const started = { name: "one", status: "started" };
    const call = (actual: unknown) => ({ name: "one", status: "call", actual });

    it("passes only when every call came back right", () => {
      expect(
        run([
          started,
          call(null),
          call(null),
          call(1),
          { name: "one", status: "done" },
        ]),
      ).toEqual({ name: "one", status: "pass" });
      expect(run([started, { name: "one", status: "done" }])?.status).toBe(
        "error",
      );
    });

    it("fails on the first wrong call, even if a later one never finished", () => {
      expect(
        run([started, call(null), call(null), call(7)], "timeout"),
      ).toEqual({
        name: "one",
        status: "fail",
        message: "Call 3, count: expected 1 but got 7",
      });
      expect(run([started, call(null)], "timeout")?.message).toMatch(
        /Took too long/,
      );
    });
  });
});
