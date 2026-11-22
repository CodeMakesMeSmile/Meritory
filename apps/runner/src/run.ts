import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type Ending,
  judgeClass,
  judgeFunction,
  type Returned,
  readLine,
  type Signature,
} from "./judge.ts";
import type { Sandbox, SandboxExit } from "./sandbox.ts";

export const LANGUAGES = ["typescript", "python"] as const;
export type Language = (typeof LANGUAGES)[number];

/** A test case as the content bundle has it */
export interface BundleCase {
  uuid: string;
  description: string;
  input: Record<string, unknown>;
  expected: unknown;
  reimplements?: string;
}

export interface RunRequest {
  language: Language;
  code: string;
  signature: Record<string, unknown>;
  cases: BundleCase[];
}

export type TestStatus = "pass" | "fail" | "error";

export interface TestResult {
  name: string;
  status: TestStatus;
  message?: string;
}

/** Exercism's results.json, version 3 */
export interface RunResult {
  version: 3;
  status: TestStatus;
  message?: string;
  tests: TestResult[];
}

/** Longest message kept for a test or the whole run */
export const MESSAGE_LIMIT = 500;

const FILES: Record<Language, { solution: string; harness: string }> = {
  typescript: { solution: "solution.ts", harness: "harness.ts" },
  python: { solution: "solution.py", harness: "harness.py" },
};

const HARNESS_DIR = new URL("./harness/", import.meta.url);

function cap(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > MESSAGE_LIMIT
    ? `${trimmed.slice(0, MESSAGE_LIMIT - 3)}...`
    : trimmed;
}

/** The cases to run, leaving out any a later case replaces */
export function casesToRun(cases: BundleCase[]): RunCase[] {
  const replaced = new Set(cases.flatMap((c) => c.reimplements ?? []));
  const seen = new Map<string, number>();
  return cases
    .filter((c) => !replaced.has(c.uuid))
    .map((c) => {
      // Results are matched by name, so a repeated description gets a number
      const count = (seen.get(c.description) ?? 0) + 1;
      seen.set(c.description, count);
      const name = count > 1 ? `${c.description} (${count})` : c.description;
      return { name, input: c.input, expected: c.expected };
    });
}

function stopMessage(exit: SandboxExit): string {
  switch (exit.kind) {
    case "timeout":
      return "Took too long, so it was stopped. Look for a loop that never ends.";
    case "memory":
      return "Used too much memory, so it was stopped.";
    case "signal":
      return `Crashed with signal ${exit.signal ?? "unknown"}.`;
    default:
      return "Stopped before this case finished.";
  }
}

/** A case ready to run, with the name results come back under */
export interface RunCase {
  name: string;
  input: Record<string, unknown>;
  expected: unknown;
}

interface Seen {
  returned: Returned[];
  ending: Ending | null;
}

function readReturned(line: Record<string, unknown>): Returned | undefined {
  if ("actual" in line) return { actual: line.actual };
  if (typeof line.shown === "string") return { shown: cap(line.shown) };
  return undefined;
}

/**
 * Reads what the harness wrote, judges each case outside the box, and fills in
 * what a stopped run never reached
 */
export function collectResults(
  cases: RunCase[],
  signature: Signature,
  language: Language,
  lines: string,
  exit: SandboxExit,
): RunResult {
  const seen = new Map<string, Seen>();
  let running: string | null = null;
  let ended = 0;
  for (const text of lines.split("\n")) {
    if (!text.trim()) continue;
    let line: Record<string, unknown>;
    try {
      const parsed = readLine(text, language === "python");
      if (typeof parsed !== "object" || parsed === null) continue;
      line = parsed as Record<string, unknown>;
    } catch {
      continue;
    }
    if (line.status === "broken") {
      // The learner's file didn't load, so no case ran
      return {
        version: 3,
        status: "error",
        message: cap(String(line.message ?? "The code didn't load.")),
        tests: [],
      };
    }
    if (typeof line.name !== "string") continue;
    if (line.status === "started") {
      // A fresh start drops anything written under this name before it
      seen.set(line.name, { returned: [], ending: null });
      running = line.name;
      continue;
    }
    const at = seen.get(line.name);
    if (!at || at.ending) continue;
    if (line.status === "call") {
      const returned = readReturned(line);
      if (returned) at.returned.push(returned);
      continue;
    }
    if (line.status === "done") {
      at.ending = { status: "done", returned: readReturned(line) };
    } else if (line.status === "threw" || line.status === "error") {
      at.ending = {
        status: line.status,
        message: cap(String(line.message ?? "")),
      };
    } else {
      continue;
    }
    ended += 1;
    running = null;
  }

  if (ended === 0 && running === null && exit.kind !== "ok") {
    // It stopped before the first case, so the code itself didn't load
    return {
      version: 3,
      status: "error",
      message: cap(exit.stderr || stopMessage(exit)),
      tests: [],
    };
  }

  const tests = cases.map((test): TestResult => {
    const name = test.name;
    const at = seen.get(name);
    const verdict = !at
      ? null
      : signature.class
        ? judgeClass(
            signature,
            test.input,
            test.expected,
            at.returned,
            at.ending,
          )
        : at.ending
          ? judgeFunction(signature, test.expected, at.ending)
          : null;
    if (verdict) {
      return {
        name,
        status: verdict.status,
        ...(verdict.message ? { message: cap(verdict.message) } : {}),
      };
    }
    if (name === running) {
      return { name, status: "error", message: stopMessage(exit) };
    }
    return {
      name,
      status: "error",
      message: "Didn't run, because an earlier case stopped the run.",
    };
  });
  const status: TestStatus = tests.some((t) => t.status === "error")
    ? "error"
    : tests.some((t) => t.status === "fail")
      ? "fail"
      : "pass";
  return { version: 3, status, tests };
}

/** Runs the learner's code against the cases in one sandbox */
export async function runCode(
  request: RunRequest,
  sandbox: Sandbox,
): Promise<RunResult> {
  const files = FILES[request.language];
  const cases = casesToRun(request.cases);
  const box = await sandbox.open();
  try {
    const harness = await readFile(new URL(files.harness, HARNESS_DIR), "utf8");
    await Promise.all([
      writeFile(join(box.dir, files.solution), request.code),
      writeFile(join(box.dir, files.harness), harness),
      writeFile(
        join(box.dir, "signature.json"),
        JSON.stringify(request.signature),
      ),
      // Inputs only, so nothing in the box knows the right answers
      writeFile(
        join(box.dir, "cases.json"),
        JSON.stringify(cases.map(({ name, input }) => ({ name, input }))),
      ),
    ]);
    const exit = await box.run(request.language, files.harness);
    const lines = await readFile(join(box.dir, "results.jsonl"), "utf8").catch(
      () => "",
    );
    return collectResults(
      cases,
      request.signature as unknown as Signature,
      request.language,
      lines,
      exit,
    );
  } finally {
    await box.close();
  }
}
