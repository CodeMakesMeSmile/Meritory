import type { CodeLanguage, CodeRunResponse } from "@meritory/contracts";
import { readStored, writeStored } from "./device-storage";
import type { Exercise } from "./practice";

export type CodingExercise = Extract<Exercise, { kind: "coding" }>;
type Signature = CodingExercise["signature"];
type Param = { name: string; type: string; hidden?: boolean };

export const LANGUAGE_NAMES: Record<CodeLanguage, string> = {
  typescript: "TypeScript",
  python: "Python",
};

const TS_TYPES: Record<string, string> = {
  int: "number",
  long: "number",
  double: "number",
  boolean: "boolean",
  char: "string",
  string: "string",
  ListNode: "ListNode | null",
  TreeNode: "TreeNode | null",
  void: "void",
};

/** A node param can be None, like an empty list */
const optional = (name: string) => `Optional[${name}]`;

const PY_TYPES: Record<string, string> = {
  int: "int",
  long: "int",
  double: "float",
  boolean: "bool",
  char: "str",
  string: "str",
  ListNode: optional("ListNode"),
  TreeNode: optional("TreeNode"),
  void: "None",
};

function tsType(type: string): string {
  if (type.endsWith("[]")) {
    const inner = tsType(type.slice(0, -2));
    return inner.includes(" ") ? `(${inner})[]` : `${inner}[]`;
  }
  return TS_TYPES[type] ?? "unknown";
}

function pyType(type: string): string {
  if (type.endsWith("[]")) return `list[${pyType(type.slice(0, -2))}]`;
  return PY_TYPES[type] ?? "object";
}

const shown = (params: Param[]) => params.filter((p) => !p.hidden);

function usesNodes(signature: Signature): boolean {
  return /ListNode|TreeNode/.test(JSON.stringify(signature));
}

/** The empty function or class the learner starts from */
export function starterCode(
  signature: Signature,
  language: CodeLanguage,
): string {
  const s = signature as {
    function?: string;
    class?: string;
    params: Param[];
    returns?: string;
    methods?: { name: string; params: Param[]; returns: string }[];
  };
  if (language === "typescript") {
    const args = (params: Param[]) =>
      shown(params)
        .map((p) => `${p.name}: ${tsType(p.type)}`)
        .join(", ");
    if (s.class) {
      const methods = (s.methods ?? [])
        .map(
          (m) => `  ${m.name}(${args(m.params)}): ${tsType(m.returns)} {\n  }`,
        )
        .join("\n\n");
      return `export class ${s.class} {\n  constructor(${args(s.params)}) {\n  }\n\n${methods}\n}\n`;
    }
    return `export function ${s.function}(${args(s.params)}): ${tsType(s.returns ?? "void")} {\n}\n`;
  }
  const args = (params: Param[]) =>
    ["self", ...shown(params).map((p) => `${p.name}: ${pyType(p.type)}`)].join(
      ", ",
    );
  const header = usesNodes(signature)
    ? "from typing import Optional\n\n\n"
    : "";
  if (s.class) {
    const methods = (s.methods ?? [])
      .map(
        (m) =>
          `    def ${m.name}(${args(m.params)}) -> ${pyType(m.returns)}:\n        pass`,
      )
      .join("\n\n");
    return `${header}class ${s.class}:\n    def __init__(${args(s.params)}):\n        pass\n\n${methods}\n`;
  }
  return `${header}class Solution:\n    def ${s.function}(${args(s.params)}) -> ${pyType(s.returns ?? "void")}:\n        pass\n`;
}

function codeKey(trackId: string, exerciseId: string, language: CodeLanguage) {
  return `meritory.code.${trackId}.${exerciseId}.${language}`;
}

// Where the language was kept before it moved to Settings
const OLD_LANGUAGE_KEY = "meritory.code.language";

/** The learner's code for this exercise and language, or null if there's none */
export function readCode(
  trackId: string,
  exerciseId: string,
  language: CodeLanguage,
): string | null {
  const stored = readStored(codeKey(trackId, exerciseId, language));
  return stored === null ? null : stored.slice(0, 65536);
}

export function writeCode(
  trackId: string,
  exerciseId: string,
  language: CodeLanguage,
  code: string | null,
) {
  writeStored(codeKey(trackId, exerciseId, language), code);
}

/** The language this browser kept before Settings, read once and then forgotten */
export function takeOldLanguage(): CodeLanguage | null {
  const stored = readStored(OLD_LANGUAGE_KEY);
  if (stored === null) return null;
  writeStored(OLD_LANGUAGE_KEY, null);
  return stored === "python" || stored === "typescript" ? stored : null;
}

/** The run's codes, kept here so pages don't load the API schemas */
export const CODE_RUN_ERRORS = {
  runnerOffline: "runner_offline",
  runnerBusy: "runner_busy",
  runnerFailed: "runner_failed",
  codeTooLarge: "code_too_large",
  runInProgress: "run_in_progress",
} as const;

/** One code for the rate limit, whether or not its answer carries one */
const TOO_MANY = "too_many";
const RATE_LIMITED = "rate_limited";

export type RunOutcome =
  | { ok: true; result: CodeRunResponse }
  | { ok: false; reason: "signed_out" | "offline" | "failed"; code?: string };

/** What to tell the learner when a run didn't come back */
export function runProblem(outcome: Exclude<RunOutcome, { ok: true }>): string {
  if (outcome.reason === "signed_out") {
    return "You've been signed out. Sign in again, then run it. Your code stays saved in this browser.";
  }
  if (outcome.reason === "offline") {
    return "Meritory isn't reachable. Check your connection, then run it again.";
  }
  switch (outcome.code) {
    case CODE_RUN_ERRORS.runnerOffline:
      return "The code runner isn't running. Start it in Ubuntu, then run it again.";
    case CODE_RUN_ERRORS.runnerBusy:
      return "The runner is checking another answer. Try again in a moment.";
    case CODE_RUN_ERRORS.codeTooLarge:
      return "Your code is over 64 KB. Shorten it, then run it again.";
    case CODE_RUN_ERRORS.runInProgress:
      return "Another run of yours is still going. Wait for it to finish, then try again.";
    case TOO_MANY:
      return "That's a lot of runs in one minute. Wait a moment, then try again.";
    default:
      return "The runner couldn't check that. Try again.";
  }
}

export async function runCode(body: {
  trackId: string;
  chapterId: string;
  exerciseId: string;
  language: CodeLanguage;
  code: string;
}): Promise<RunOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/v1/code/runs", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: "offline" };
  }
  if (res.status === 401) return { ok: false, reason: "signed_out" };
  if (!res.ok) {
    let code: string | undefined;
    try {
      const data: unknown = await res.json();
      const value = (data as { code?: unknown } | null)?.code;
      code = typeof value === "string" ? value : undefined;
    } catch {
      code = undefined;
    }
    if (res.status === 429) code = busyCode(code);
    // The body limit counts bytes, so code under the character limit can still be refused
    if (res.status === 413) code = CODE_RUN_ERRORS.codeTooLarge;
    return { ok: false, reason: "failed", code };
  }
  try {
    const data = (await res.json()) as CodeRunResponse | null;
    // summary() and the page read tests, so a body without them is a failed run
    if (Array.isArray(data?.tests)) return { ok: true, result: data };
  } catch {
    // A body that isn't JSON falls through to the failed result
  }
  return { ok: false, reason: "failed" };
}

const KNOWN_CODES: readonly string[] = [
  ...Object.values(CODE_RUN_ERRORS),
  TOO_MANY,
];

// Any other unknown 429 code means the runner is busy
function busyCode(code: string | undefined): string {
  if (!code || code === RATE_LIMITED) return TOO_MANY;
  return KNOWN_CODES.includes(code) ? code : CODE_RUN_ERRORS.runnerBusy;
}

/** Numbers each run, so an answer that comes back after a newer run or a reset is dropped */
export function runCounter() {
  let latest = 0;
  return {
    start: () => ++latest,
    isLatest: (run: number) => run === latest,
    cancel: () => {
      latest += 1;
    },
  };
}

/** "All 6 cases passed", or how many did */
export function summary(result: CodeRunResponse): string {
  const total = result.tests.length;
  const passed = result.tests.filter((t) => t.status === "pass").length;
  if (total === 0) return "Your code didn't run";
  if (passed === total) return `All ${total} cases passed`;
  return `${passed} of ${total} cases passed`;
}
