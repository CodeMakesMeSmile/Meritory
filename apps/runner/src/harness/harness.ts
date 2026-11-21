// Runs inside the sandbox next to solution.ts, signature.json, and cases.json
import { appendFileSync, readFileSync } from "node:fs";

class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(
    val = 0,
    left: TreeNode | null = null,
    right: TreeNode | null = null,
  ) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Solutions use them without importing, as on LeetCode
Object.assign(globalThis, { ListNode, TreeNode });

type Callable = (...args: unknown[]) => unknown;
type Param = { name: string; type: string; hidden?: boolean };
type Signature = {
  function?: string;
  class?: string;
  params: Param[];
  returns?: string;
  checks?: string;
  anyOrder?: boolean;
  methods?: { name: string; params: Param[]; returns: string }[];
};
type Case = { name: string; input: Record<string, unknown>; expected: unknown };

const RESULTS = "results.jsonl";
const TOLERANCE = 1e-5;
const MAX_NODES = 100000;

function record(line: object) {
  appendFileSync(RESULTS, `${JSON.stringify(line)}\n`);
}

function toList(values: number[]): ListNode | null {
  const head = new ListNode();
  let tail = head;
  for (const value of values) {
    tail.next = new ListNode(value);
    tail = tail.next;
  }
  return head.next;
}

function toTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0 || values[0] === null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let at = 1;
  for (let i = 0; i < queue.length && at < values.length; i++) {
    const node = queue[i] as TreeNode;
    for (const side of ["left", "right"] as const) {
      const value = values[at++];
      if (value !== null && value !== undefined) {
        node[side] = new TreeNode(value);
        queue.push(node[side]);
      }
    }
  }
  return root;
}

function fromList(head: unknown): number[] {
  const values: number[] = [];
  let node = head as ListNode | null;
  while (node && values.length < MAX_NODES) {
    values.push(node.val);
    node = node.next;
  }
  return values;
}

function fromTree(root: unknown): (number | null)[] {
  const values: (number | null)[] = [];
  const queue = [root as TreeNode | null];
  for (let i = 0; i < queue.length && values.length < MAX_NODES; i++) {
    const node = queue[i] ?? null;
    values.push(node ? node.val : null);
    if (node) queue.push(node.left, node.right);
  }
  while (values.length > 0 && values[values.length - 1] === null) values.pop();
  return values;
}

/** Turns a JSON value into what the solution takes */
function build(type: string, value: unknown): unknown {
  if (type.endsWith("[]") && Array.isArray(value)) {
    const inner = type.slice(0, -2);
    if (inner.startsWith("ListNode") || inner.startsWith("TreeNode")) {
      return value.map((item) => build(inner, item));
    }
  }
  if (type === "ListNode") return toList(value as number[]);
  if (type === "TreeNode") return toTree(value as (number | null)[]);
  return structuredClone(value);
}

/** Turns what the solution returned back into JSON */
function back(type: string, value: unknown): unknown {
  if (type === "ListNode") return fromList(value);
  if (type === "TreeNode") return fromTree(value);
  if (type.endsWith("[]") && Array.isArray(value)) {
    const inner = type.slice(0, -2);
    return value.map((item) => back(inner, item));
  }
  return value;
}

function same(actual: unknown, expected: unknown, loose: boolean): boolean {
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
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function sortedCopy(value: unknown): unknown {
  return Array.isArray(value)
    ? [...value].sort((a, b) =>
        JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
      )
    : value;
}

function matches(
  type: string,
  actual: unknown,
  expected: unknown,
  anyOrder = false,
): boolean {
  const loose = type.startsWith("double");
  return anyOrder
    ? same(sortedCopy(actual), sortedCopy(expected), loose)
    : same(actual, expected, loose);
}

function show(value: unknown): string {
  const text = JSON.stringify(value);
  return text === undefined ? String(value) : text;
}

function describe(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : `Threw ${show(error)}`;
}

function isRefusal(expected: unknown): expected is { error: string } {
  return (
    typeof expected === "object" &&
    expected !== null &&
    !Array.isArray(expected) &&
    "error" in expected
  );
}

/** Calls a function and checks what it returns, or what it changed */
function runFunction(fn: Callable, signature: Signature, test: Case) {
  const args = new Map<string, unknown>();
  for (const param of signature.params) {
    args.set(param.name, build(param.type, test.input[param.name]));
  }
  // A hidden int marks where a list's tail links back to, -1 for no cycle
  const hidden = signature.params.find((p) => p.hidden);
  const list = signature.params.find((p) => p.type === "ListNode" && !p.hidden);
  if (hidden && list) {
    const at = test.input[hidden.name] as number;
    let node = args.get(list.name) as ListNode | null;
    let target: ListNode | null = null;
    for (let i = 0; node; i++) {
      if (i === at) target = node;
      if (!node.next) {
        node.next = target;
        break;
      }
      node = node.next;
    }
  }
  const passed = signature.params.filter((p) => !p.hidden);
  const refusal = isRefusal(test.expected);
  let value: unknown;
  try {
    value = fn(...passed.map((p) => args.get(p.name)));
  } catch (error) {
    if (refusal) return { status: "pass" };
    return { status: "error", message: describe(error) };
  }
  if (refusal) {
    return {
      status: "fail",
      message: `Expected an error, but got ${show(value)}`,
    };
  }
  const checked = signature.checks
    ? signature.params.find((p) => p.name === signature.checks)
    : undefined;
  const type = checked ? checked.type : (signature.returns as string);
  const actual = back(type, checked ? args.get(checked.name) : value);
  return matches(type, actual, test.expected, signature.anyOrder)
    ? { status: "pass" }
    : {
        status: "fail",
        message: `Expected ${show(test.expected)} but got ${show(actual)}`,
      };
}

/** Makes the object, then makes each call in order */
function runClass(
  Made: new (...args: unknown[]) => object,
  signature: Signature,
  test: Case,
) {
  const calls = test.input.calls as string[];
  const argLists = test.input.args as unknown[][];
  const expected = test.expected as unknown[];
  let object: Record<string, Callable> | null = null;
  for (let i = 0; i < calls.length; i++) {
    const name = calls[i] as string;
    const method =
      i === 0 ? null : signature.methods?.find((m) => m.name === name);
    const params = i === 0 ? signature.params : (method?.params ?? []);
    const args = (argLists[i] ?? []).map((arg, at) =>
      build(params[at]?.type ?? "", arg),
    );
    let value: unknown;
    try {
      if (i === 0) {
        object = new Made(...args) as Record<string, Callable>;
        continue;
      }
      const fn = object?.[name];
      if (typeof fn !== "function") {
        return {
          status: "error",
          message: `${signature.class} has no method ${name}`,
        };
      }
      value = fn.apply(object, args);
    } catch (error) {
      return {
        status: "error",
        message: `Call ${i + 1}, ${name}: ${describe(error)}`,
      };
    }
    const returns = method?.returns ?? "void";
    const actual = returns === "void" ? null : back(returns, value);
    const want = returns === "void" ? null : expected[i];
    if (!matches(returns, actual, want)) {
      return {
        status: "fail",
        message: `Call ${i + 1}, ${name}: expected ${show(want)} but got ${show(actual)}`,
      };
    }
  }
  return { status: "pass" };
}

const signature = JSON.parse(
  readFileSync("signature.json", "utf8"),
) as Signature;
const cases = JSON.parse(readFileSync("cases.json", "utf8")) as Case[];
// A variable path keeps the type checker from looking for the learner's file
const solutionPath = "./solution.ts";
let solution: Record<string, unknown> = {};
try {
  solution = (await import(solutionPath)) as Record<string, unknown>;
} catch (error) {
  const line = /solution\.ts:(\d+)/.exec(
    error instanceof Error ? (error.stack ?? "") : "",
  );
  record({
    status: "broken",
    message: `${describe(error)}${line ? ` (line ${line[1]})` : ""}`,
  });
  process.exit(0);
}
const name = signature.class ?? signature.function ?? "";
const target = solution[name];

for (const test of cases) {
  record({ name: test.name, status: "started" });
  if (typeof target !== "function") {
    record({
      name: test.name,
      status: "error",
      message: `solution.ts doesn't export ${signature.class ? "a class" : "a function"} named ${name}`,
    });
    continue;
  }
  const result = signature.class
    ? runClass(target as new (...args: unknown[]) => object, signature, test)
    : runFunction(target as Callable, signature, test);
  record({ name: test.name, ...result });
}
