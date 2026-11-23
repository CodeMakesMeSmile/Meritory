import { createHash } from "node:crypto";
import Type, { type Static } from "typebox";
import {
  CLASS_PATTERN,
  type ClassSignature,
  type FunctionSignature,
  NAME_PATTERN,
  type Param,
  type Signature,
  TestCase,
  UUID_PATTERN,
} from "./exercise.ts";
import { ID_PATTERN, TEXT_PATTERN } from "./fact.ts";
import { canonicalJson, fitsType } from "./values.ts";
import { checkSchema, isRecord, type Problem, readText } from "./yaml-file.ts";

const Text = (maxLength: number) =>
  Type.String({ minLength: 1, maxLength, pattern: TEXT_PATTERN });
const Comments = Type.Optional(Type.Array(Text(500)));

const Group = Type.Object(
  {
    description: Text(200),
    cases: Type.Array(Type.Unknown(), { minItems: 1 }),
    comments: Comments,
  },
  { additionalProperties: false },
);

const CasesFile = Type.Object(
  {
    exercise: Type.String({ pattern: ID_PATTERN }),
    cases: Type.Array(Type.Unknown(), { minItems: 1 }),
    comments: Comments,
  },
  { additionalProperties: false },
);

const HASH = /^[0-9a-f]{64}$/;

export const LOCK_FILE = "cases.lock.json";

const SAFE_UUID = new RegExp(UUID_PATTERN);
const SAFE_NAME = new RegExp(NAME_PATTERN);
const SAFE_CLASS = new RegExp(CLASS_PATTERN);

/** A case with the line of its uuid, for reporting */
export type LoadedCase = { testCase: TestCase; line: number | null };

/** Reads `cases.json`, checks its shape, and returns every case in file order */
export async function readCases(
  file: string,
  exerciseId: string,
  problems: Problem[],
): Promise<LoadedCase[] | undefined> {
  const text = await readText(file);
  if (text === undefined) return undefined;
  const data = parseJson(file, text, problems);
  if (data === undefined) return [];
  const lineOf = (pattern: RegExp) => lineMatching(text, pattern);
  const root = check<Static<typeof CasesFile>>(
    CasesFile,
    data,
    "the file",
    file,
    () => null,
    problems,
  );
  if (!root) return [];
  if (root.exercise !== exerciseId) {
    problems.push({
      file,
      line: lineOf(/"exercise"\s*:/),
      message: `exercise must match the exercise id, ${exerciseId}`,
    });
  }

  const cases: LoadedCase[] = [];
  const walk = (items: unknown[], path: string) => {
    items.forEach((item, index) => {
      const at = `${path}/${index}`;
      if (isRecord(item) && "cases" in item) {
        const group = check<Static<typeof Group>>(
          Group,
          item,
          at,
          file,
          () => null,
          problems,
        );
        if (group) walk(group.cases, `${at}/cases`);
        return;
      }
      const uuid = isRecord(item) ? item.uuid : undefined;
      const safe = typeof uuid === "string" && SAFE_UUID.test(uuid);
      const name = safe ? `case ${uuid}` : `case at ${at}`;
      // The uuid field itself, since a fix names an older case's uuid too
      const line = safe ? lineOf(new RegExp(`"uuid"\\s*:\\s*"${uuid}"`)) : null;
      const testCase = check<TestCase>(
        TestCase,
        item,
        name,
        file,
        () => line,
        problems,
      );
      if (testCase) cases.push({ testCase, line });
    });
  };
  walk(root.cases, "cases");
  return cases;
}

/** Checks that cases fit the signature and that each fix points at a real case */
export function checkCases(
  file: string,
  signature: Signature,
  cases: LoadedCase[],
  problems: Problem[],
) {
  const uuids = new Set(cases.map(({ testCase }) => testCase.uuid));
  const earlier = new Set<string>();
  for (const { testCase, line } of cases) {
    const report = (message: string) =>
      problems.push({
        file,
        line,
        message: `case ${testCase.uuid} ${message}`,
      });
    const { reimplements } = testCase;
    if (reimplements === testCase.uuid) {
      report("can't reimplement itself");
    } else if (reimplements !== undefined && !uuids.has(reimplements)) {
      report(`reimplements ${reimplements}, which isn't a case in this file`);
    } else if (reimplements !== undefined && !earlier.has(reimplements)) {
      // Two cases that name each other would both be left out of a run
      report(`reimplements ${reimplements}, which must come before it`);
    }
    earlier.add(testCase.uuid);
    if ("class" in signature) {
      checkClassCase(signature, testCase, report);
    } else {
      checkFunctionCase(signature, testCase, report);
    }
  }
}

function checkFunctionCase(
  signature: FunctionSignature,
  testCase: TestCase,
  report: (message: string) => void,
) {
  if (testCase.property !== signature.function) {
    report(`property must be ${signature.function}`);
  }
  checkInputs(signature.params, testCase.input, "input", report);
  if (isError(testCase.expected)) return;
  const checked = signature.params.find((p) => p.name === signature.checks);
  const type = signature.returns === "void" ? checked?.type : signature.returns;
  if (type !== undefined && !fitsType(type, testCase.expected)) {
    report(`expected must be ${type}`);
  }
}

function checkClassCase(
  signature: ClassSignature,
  testCase: TestCase,
  report: (message: string) => void,
) {
  if (testCase.property !== signature.class) {
    report(`property must be ${signature.class}`);
  }
  const { calls, args, ...rest } = testCase.input;
  for (const key of Object.keys(rest)) {
    report(
      SAFE_NAME.test(key)
        ? `input/${key} is not a field, only calls and args are`
        : "input has a field that isn't calls or args",
    );
  }
  if (
    !Array.isArray(calls) ||
    !calls.every((call) => typeof call === "string") ||
    !Array.isArray(args) ||
    !args.every(Array.isArray) ||
    calls.length === 0 ||
    calls.length !== args.length
  ) {
    report("input must have calls and args, two lists of the same length");
    return;
  }

  const methods = new Map(signature.methods.map((m) => [m.name, m]));
  const returns: (string | undefined)[] = [];
  calls.forEach((call, index) => {
    if (index === 0) {
      if (call !== signature.class) {
        report(`input/calls/0 must be ${signature.class}`);
      }
      checkArgs(signature.params, args[index] ?? [], "input/args/0", report);
      returns.push("void");
      return;
    }
    const method = methods.get(call);
    if (!method) {
      report(
        SAFE_NAME.test(call) || SAFE_CLASS.test(call)
          ? `input/calls/${index} ${call} is not a method`
          : `input/calls/${index} is not a method`,
      );
      returns.push(undefined);
      return;
    }
    checkArgs(method.params, args[index] ?? [], `input/args/${index}`, report);
    returns.push(method.returns);
  });

  // The judge grades a class call by call, so it can't expect an error
  if (isError(testCase.expected)) {
    report("expected can't be an error for a class");
    return;
  }
  const expected = testCase.expected;
  if (!Array.isArray(expected) || expected.length !== calls.length) {
    report("expected must have one value per call");
    return;
  }
  returns.forEach((type, index) => {
    if (type === undefined) return;
    const value = expected[index];
    if (type === "void" ? value !== null : !fitsType(type, value)) {
      report(`expected/${index} must be ${type === "void" ? "null" : type}`);
    }
  });
}

function checkInputs(
  params: Param[],
  input: Record<string, unknown>,
  path: string,
  report: (message: string) => void,
) {
  const names = new Set(params.map((p) => p.name));
  for (const key of Object.keys(input)) {
    if (!names.has(key)) {
      report(
        SAFE_NAME.test(key)
          ? `${path}/${key} is not a parameter`
          : `${path} has a field that isn't a parameter`,
      );
    }
  }
  for (const param of params) {
    if (!(param.name in input)) {
      report(`${path} is missing ${param.name}`);
    } else if (!fitsType(param.type, input[param.name])) {
      report(`${path}/${param.name} must be ${param.type}`);
    }
  }
}

function checkArgs(
  params: Param[],
  values: unknown[],
  path: string,
  report: (message: string) => void,
) {
  if (values.length !== params.length) {
    report(`${path} must have ${params.length} values`);
    return;
  }
  params.forEach((param, index) => {
    if (!fitsType(param.type, values[index])) {
      report(`${path}/${index} must be ${param.type}`);
    }
  });
}

/** Whether an expected value is Exercism's `{"error": ...}` */
function isError(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    typeof value.error === "string"
  );
}

/** The hash a case is locked with, covering what it tests but not its description */
export function caseHash(testCase: TestCase): string {
  const { property, input, expected } = testCase;
  return createHash("sha256")
    .update(canonicalJson({ property, input, expected }))
    .digest("hex");
}

/** Reads `cases.lock.json`, case uuids and their hashes, which is empty until the first lock */
export async function readLock(
  file: string,
  problems: Problem[],
): Promise<Record<string, string>> {
  const text = await readText(file);
  if (text === undefined) return {};
  const data = parseJson(file, text, problems);
  if (data === undefined) return {};
  // Checked by hand, so a bad key is never printed
  const valid =
    isRecord(data) &&
    Object.entries(data).every(
      ([key, hash]) =>
        SAFE_UUID.test(key) && typeof hash === "string" && HASH.test(hash),
    );
  if (!valid) {
    problems.push({
      file,
      line: null,
      message: "must only map case uuids to their hashes",
    });
    return {};
  }
  return data as Record<string, string>;
}

/** Checks every case against its locked hash */
export const NOT_LOCKED = "isn't locked yet, so run pnpm content:lock";

export function checkLock(
  casesFile: string,
  lockFile: string,
  cases: LoadedCase[],
  lock: Record<string, string>,
  problems: Problem[],
) {
  const present = new Set<string>();
  for (const { testCase, line } of cases) {
    present.add(testCase.uuid);
    const locked = lock[testCase.uuid];
    const message =
      locked === undefined
        ? NOT_LOCKED
        : locked !== caseHash(testCase)
          ? "changed after it was locked, so undo the change and add a new case that reimplements it"
          : undefined;
    if (message) {
      problems.push({
        file: casesFile,
        line,
        message: `case ${testCase.uuid} ${message}`,
      });
    }
  }
  for (const uuid of Object.keys(lock)) {
    if (!present.has(uuid)) {
      problems.push({
        file: lockFile,
        line: null,
        message: `case ${uuid} was removed after it was locked, so put it back and add a new case that reimplements it`,
      });
    }
  }
}

/** Adds hashes for new cases and keeps every existing one as it is */
export function addToLock(
  lock: Record<string, string>,
  cases: LoadedCase[],
): { lock: Record<string, string>; added: number } {
  const next = { ...lock };
  let added = 0;
  for (const { testCase } of cases) {
    if (next[testCase.uuid] === undefined) {
      next[testCase.uuid] = caseHash(testCase);
      added++;
    }
  }
  const sorted = Object.fromEntries(
    Object.entries(next).sort(([a], [b]) => a.localeCompare(b)),
  );
  return { lock: sorted, added };
}

function check<T>(
  schema: Parameters<typeof checkSchema>[0],
  data: unknown,
  name: string,
  file: string,
  line: () => number | null,
  problems: Problem[],
): T | undefined {
  const found: Problem[] = [];
  const value = checkSchema<T>(
    schema,
    file,
    { data, lineAt: line },
    found,
    name,
  );
  for (const problem of found) {
    const named =
      name === "the file" || problem.message.startsWith(name)
        ? problem.message
        : `${name} ${problem.message}`;
    problems.push({ ...problem, message: named });
  }
  return value;
}

/** Parses a JSON file, or reports that it isn't valid without quoting it */
export function parseJson(
  file: string,
  text: string,
  problems: Problem[],
): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    // The parser's message quotes the file, which could hold control characters
    problems.push({ file, line: null, message: "is not valid JSON" });
    return undefined;
  }
}

function lineMatching(text: string, pattern: RegExp): number | null {
  const index = text.search(pattern);
  return index === -1 ? null : text.slice(0, index).split("\n").length;
}
