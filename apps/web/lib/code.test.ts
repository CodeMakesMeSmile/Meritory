import { afterEach, describe, expect, it, vi } from "vitest";
import { runCode, runProblem, starterCode, summary } from "./code";

const pairSum = {
  function: "pairSum",
  params: [
    { name: "nums", type: "int[]" },
    { name: "target", type: "int" },
  ],
  returns: "int[]",
} as never;

const listCycle = {
  function: "hasCycle",
  params: [
    { name: "head", type: "ListNode" },
    { name: "pos", type: "int", hidden: true },
  ],
  returns: "boolean",
} as never;

const cache = {
  class: "LRUCache",
  params: [{ name: "capacity", type: "int" }],
  methods: [
    { name: "get", params: [{ name: "key", type: "int" }], returns: "int" },
    {
      name: "put",
      params: [
        { name: "key", type: "int" },
        { name: "value", type: "int" },
      ],
      returns: "void",
    },
  ],
} as never;

describe("starterCode", () => {
  it("writes a typed function in each language", () => {
    expect(starterCode(pairSum, "typescript")).toBe(
      "export function pairSum(nums: number[], target: number): number[] {\n}\n",
    );
    expect(starterCode(pairSum, "python")).toBe(
      "class Solution:\n    def pairSum(self, nums: list[int], target: int) -> list[int]:\n        pass\n",
    );
  });

  it("leaves out hidden params and imports Optional for nodes", () => {
    expect(starterCode(listCycle, "typescript")).toContain(
      "hasCycle(head: ListNode | null): boolean",
    );
    const python = starterCode(listCycle, "python");
    expect(python.startsWith("from typing import Optional\n")).toBe(true);
    expect(python).toContain(
      "def hasCycle(self, head: Optional[ListNode]) -> bool:",
    );
  });

  it("writes a class with its constructor and methods", () => {
    const ts = starterCode(cache, "typescript");
    expect(ts).toContain("export class LRUCache {");
    expect(ts).toContain("constructor(capacity: number) {");
    expect(ts).toContain("put(key: number, value: number): void {");
    const py = starterCode(cache, "python");
    expect(py).toContain("class LRUCache:");
    expect(py).toContain("def __init__(self, capacity: int):");
    expect(py).toContain("def get(self, key: int) -> int:");
  });
});

describe("summary", () => {
  const test = (status: "pass" | "fail") => ({ name: "n", status });
  it("counts passed cases", () => {
    expect(summary({ version: 3, status: "pass", tests: [test("pass")] })).toBe(
      "All 1 cases passed",
    );
    expect(
      summary({
        version: 3,
        status: "fail",
        tests: [test("pass"), test("fail")],
      }),
    ).toBe("1 of 2 cases passed");
    expect(summary({ version: 3, status: "error", tests: [] })).toBe(
      "Your code didn't run",
    );
  });
});

describe("runCode", () => {
  afterEach(() => vi.unstubAllGlobals());
  const body = {
    trackId: "dsa",
    chapterId: "c",
    exerciseId: "e",
    language: "python" as const,
    code: "",
  };
  const answer = (status: number, json: unknown) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(json), { status })),
    );

  it("names each way a run can fail", async () => {
    answer(401, {});
    expect(await runCode(body)).toEqual({ ok: false, reason: "signed_out" });
    answer(503, { code: "runner_offline" });
    const offline = await runCode(body);
    expect(offline).toEqual({
      ok: false,
      reason: "failed",
      code: "runner_offline",
    });
    expect(runProblem(offline as never)).toContain("isn't running");
    answer(429, { statusCode: 429, message: "Too many runs." });
    const limited = await runCode(body);
    expect(runProblem(limited as never)).toContain("a lot of runs");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network");
      }),
    );
    expect(await runCode(body)).toEqual({ ok: false, reason: "offline" });
  });

  it("returns the runner's result", async () => {
    const result = { version: 3, status: "pass", tests: [] };
    answer(200, result);
    expect(await runCode(body)).toEqual({ ok: true, result });
  });
});
