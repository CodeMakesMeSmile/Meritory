import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
export function casesToRun(cases: BundleCase[]) {
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

/** Reads the harness's lines and fills in what a stopped run never reached */
export function collectResults(
  names: string[],
  lines: string,
  exit: SandboxExit,
): RunResult {
  const finished = new Map<string, TestResult>();
  let running: string | null = null;
  for (const line of lines.split("\n")) {
    if (!line.trim()) continue;
    let parsed: { name?: unknown; status?: unknown; message?: unknown };
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (parsed.status === "broken") {
      // The learner's file didn't load, so no case ran
      return {
        version: 3,
        status: "error",
        message: cap(String(parsed.message ?? "The code didn't load.")),
        tests: [],
      };
    }
    if (typeof parsed.name !== "string") continue;
    if (parsed.status === "started") {
      running = parsed.name;
      continue;
    }
    if (
      parsed.status === "pass" ||
      parsed.status === "fail" ||
      parsed.status === "error"
    ) {
      finished.set(parsed.name, {
        name: parsed.name,
        status: parsed.status,
        ...(typeof parsed.message === "string"
          ? { message: cap(parsed.message) }
          : {}),
      });
      running = null;
    }
  }

  if (finished.size === 0 && running === null && exit.kind !== "ok") {
    // It stopped before the first case, so the code itself didn't load
    return {
      version: 3,
      status: "error",
      message: cap(exit.stderr || stopMessage(exit)),
      tests: [],
    };
  }

  const tests = names.map((name): TestResult => {
    const done = finished.get(name);
    if (done) return done;
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
      writeFile(join(box.dir, "cases.json"), JSON.stringify(cases)),
    ]);
    const exit = await box.run(request.language, files.harness);
    const lines = await readFile(join(box.dir, "results.jsonl"), "utf8").catch(
      () => "",
    );
    return collectResults(
      cases.map((c) => c.name),
      lines,
      exit,
    );
  } finally {
    await box.close();
  }
}
