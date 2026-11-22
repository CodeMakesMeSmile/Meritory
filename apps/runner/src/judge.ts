/**
 * Checks what the learner's code gave back against each case's expected value.
 * This runs outside the box, which never sees the expected values, so an answer
 * can't read them or write its own verdicts.
 */

export interface Param {
  name: string;
  type: string;
  hidden?: boolean;
}

/** The parts of a signature that decide how values compare */
export interface Signature {
  function?: string;
  class?: string;
  params: Param[];
  returns?: string;
  checks?: string;
  anyOrder?: boolean;
  methods?: { name: string; params: Param[]; returns: string }[];
}

/** What came back, or how it looked when JSON couldn't carry it */
export type Returned = { actual: unknown } | { shown: string };

/** How a case ended inside the box */
export type Ending =
  | { status: "done"; returned?: Returned }
  | { status: "threw"; message: string }
  | { status: "error"; message: string };

export interface Verdict {
  status: "pass" | "fail" | "error";
  message?: string;
}

const TOLERANCE = 1e-5;

// Node has JSON.rawJSON, but the ES2024 types don't list it yet
const { rawJSON } = JSON as unknown as { rawJSON(text: string): unknown };

/** A Python float with a whole value, like 2.0, which an int doesn't match */
class WholeFloat {
  readonly value: number;
  readonly source: string;

  constructor(value: number, source: string) {
    this.value = value;
    this.source = source;
  }

  toJSON() {
    return rawJSON(this.source);
  }
}

/**
 * Reads one line the harness wrote. Python's 2.0 stays apart from 2, since
 * the Python harness always failed a float where an int was expected.
 */
export function readLine(line: string, python: boolean): unknown {
  if (!python) return JSON.parse(line);
  return JSON.parse(
    line,
    (_key: string, value: unknown, context?: { source?: string }) =>
      typeof value === "number" &&
      Number.isInteger(value) &&
      /[.eE]/.test(context?.source ?? "")
        ? new WholeFloat(value, context?.source ?? "")
        : value,
  );
}

export function show(value: unknown): string {
  try {
    const text = JSON.stringify(value);
    if (text !== undefined) return text;
  } catch {
    // Falls through to the plain name below
  }
  return String(value);
}

function same(actual: unknown, expected: unknown, loose: boolean): boolean {
  if (actual instanceof WholeFloat) {
    if (!loose) return false;
    return same(actual.value, expected, loose);
  }
  if (typeof actual === "number" && typeof expected === "number") {
    return loose
      ? Math.abs(actual - expected) <= TOLERANCE
      : actual === expected;
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return (
      actual.length === expected.length &&
      actual.every((item, i) => same(item, expected[i], loose))
    );
  }
  return show(actual) === show(expected);
}

function sortedCopy(value: unknown): unknown {
  return Array.isArray(value)
    ? [...value].sort((a, b) => (show(a) < show(b) ? -1 : 1))
    : value;
}

function matches(
  type: string,
  returned: Returned,
  expected: unknown,
  anyOrder = false,
): boolean {
  if (!("actual" in returned)) return false;
  const loose = type.startsWith("double");
  return anyOrder
    ? same(sortedCopy(returned.actual), sortedCopy(expected), loose)
    : same(returned.actual, expected, loose);
}

function shown(returned: Returned): string {
  return "actual" in returned ? show(returned.actual) : returned.shown;
}

function isRefusal(expected: unknown): boolean {
  return (
    typeof expected === "object" &&
    expected !== null &&
    !Array.isArray(expected) &&
    "error" in expected
  );
}

const STOPPED = "Stopped before this case finished.";

/** A function case, from the value it returned or the error it threw */
export function judgeFunction(
  signature: Signature,
  expected: unknown,
  ending: Ending,
): Verdict {
  const refusal = isRefusal(expected);
  if (ending.status === "error") {
    return { status: "error", message: ending.message };
  }
  if (ending.status === "threw") {
    return refusal
      ? { status: "pass" }
      : { status: "error", message: ending.message };
  }
  if (!ending.returned) return { status: "error", message: STOPPED };
  if (refusal) {
    return {
      status: "fail",
      message: `Expected an error, but got ${shown(ending.returned)}`,
    };
  }
  const checked = signature.checks
    ? signature.params.find((p) => p.name === signature.checks)
    : undefined;
  const type = checked?.type ?? signature.returns ?? "";
  return matches(type, ending.returned, expected, signature.anyOrder)
    ? { status: "pass" }
    : {
        status: "fail",
        message: `Expected ${show(expected)} but got ${shown(ending.returned)}`,
      };
}

/**
 * A class case, call by call. The first wrong value fails it, even when a
 * later call threw or never finished, as the old in-box check did. Without
 * an ending or a wrong value there's no verdict yet.
 */
export function judgeClass(
  signature: Signature,
  input: Record<string, unknown>,
  expected: unknown,
  returned: Returned[],
  ending: Ending | null,
): Verdict | null {
  const calls = (input.calls ?? []) as string[];
  const wanted = (expected ?? []) as unknown[];
  for (let i = 1; i < returned.length && i < calls.length; i++) {
    const name = calls[i] as string;
    const method = signature.methods?.find((m) => m.name === name);
    const returns = method?.returns ?? "void";
    const got = returned[i] as Returned;
    if (returns === "void") continue;
    if (!matches(returns, got, wanted[i])) {
      return {
        status: "fail",
        message: `Call ${i + 1}, ${name}: expected ${show(wanted[i])} but got ${shown(got)}`,
      };
    }
  }
  if (!ending) return null;
  if (ending.status === "threw" || ending.status === "error") {
    return { status: "error", message: ending.message };
  }
  // Every call has to come back, so a run cut short can't pass
  if (returned.length !== calls.length) {
    return { status: "error", message: STOPPED };
  }
  return { status: "pass" };
}
