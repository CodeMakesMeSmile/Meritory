import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { TSchema } from "typebox";
import Value from "typebox/value";
import {
  type Document,
  isMap,
  isNode,
  isScalar,
  LineCounter,
  parseDocument,
} from "yaml";
import { ID_PATTERN, SOURCE_URL_PATTERN, TEXT_PATTERN } from "./fact.ts";

export type Problem = { file: string; line: number | null; message: string };

export type Parsed = {
  data: unknown;
  lineAt: (pointer: string) => number | null;
};

const PATTERN_MESSAGES: Record<string, string> = {
  [ID_PATTERN]: "must be lowercase words joined by hyphens",
  [SOURCE_URL_PATTERN]: "must be an https link with no user name",
  [TEXT_PATTERN]: "must not hold control characters",
};

// A %YAML 1.1 directive would turn values like "no" into false
const YAML_DIRECTIVE = /^%YAML[ \t]+(\S+)/m;

export function parseYaml(
  file: string,
  text: string,
  problems: Problem[],
): Parsed {
  const directive = YAML_DIRECTIVE.exec(text);
  if (directive && directive[1] !== "1.2") {
    problems.push({
      file,
      line: text.slice(0, directive.index).split("\n").length,
      message: `uses YAML ${directive[1]}, but only YAML 1.2 is allowed`,
    });
    return { data: undefined, lineAt: () => null };
  }

  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter, version: "1.2" });
  for (const error of doc.errors) {
    problems.push({
      file,
      line: error.linePos?.[0].line ?? null,
      message: error.message.split("\n")[0] ?? error.code,
    });
  }
  return {
    data: doc.errors.length === 0 ? doc.toJS() : undefined,
    lineAt: (pointer) => lineAt(doc, lineCounter, pointer),
  };
}

// Walks up the path until it finds a node, since a missing field has none
function lineAt(
  doc: Document,
  lineCounter: LineCounter,
  pointer: string,
): number | null {
  const keys = pointer
    .split("/")
    .slice(1)
    .map((key) => key.replaceAll("~1", "/").replaceAll("~0", "~"))
    .map((key) => (/^\d+$/.test(key) ? Number(key) : key));
  for (let depth = keys.length; depth >= 0; depth--) {
    const keyLine = depth > 0 ? fieldLine(doc, lineCounter, keys, depth) : null;
    if (keyLine !== null) return keyLine;
    const node = doc.getIn(keys.slice(0, depth), true);
    if (isNode(node) && node.range) {
      return lineCounter.linePos(node.range[0]).line;
    }
  }
  return null;
}

// A field's key line, since a list value starts on the line below it
function fieldLine(
  doc: Document,
  lineCounter: LineCounter,
  keys: (string | number)[],
  depth: number,
): number | null {
  const parent = doc.getIn(keys.slice(0, depth - 1), true);
  if (!isMap(parent)) return null;
  const pair = parent.items.find(
    (item) => isScalar(item.key) && item.key.value === keys[depth - 1],
  );
  const range = isScalar(pair?.key) ? pair.key.range : undefined;
  return range ? lineCounter.linePos(range[0]).line : null;
}

export function checkSchema<T>(
  schema: TSchema,
  file: string,
  parsed: Parsed,
  problems: Problem[],
  whole = "the file",
): T | undefined {
  if (parsed.data === undefined) return undefined;
  if (Value.Check(schema, parsed.data)) return parsed.data as T;
  for (const error of Value.Errors(schema, parsed.data)) {
    // The boolean error names the unknown field, so this one repeats it
    if (error.keyword === "additionalProperties") continue;
    const pattern =
      error.keyword === "pattern" ? String(error.params.pattern) : "";
    const message =
      error.keyword === "boolean"
        ? "is not a known field"
        : (PATTERN_MESSAGES[pattern] ?? error.message);
    const where = error.instancePath.slice(1) || whole;
    problems.push({
      file,
      line: parsed.lineAt(error.instancePath),
      message: `${where} ${message}`,
    });
  }
  return undefined;
}

/** Reads and checks one YAML file, or reports why it couldn't */
export async function readYamlFile<T>(
  schema: TSchema,
  file: string,
  problems: Problem[],
): Promise<{ value: T | undefined; parsed: Parsed } | undefined> {
  const text = await readText(file);
  if (text === undefined) return undefined;
  const parsed = parseYaml(file, text, problems);
  return { value: checkSchema<T>(schema, file, parsed, problems), parsed };
}

export async function readText(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function yamlFiles(dir: string): Promise<string[]> {
  try {
    const names = await readdir(dir);
    return names
      .filter((name) => name.endsWith(".yaml"))
      .sort()
      .map((name) => path.join(dir, name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function subfolders(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

/** A problem as one line, like a compiler error */
export function formatProblem(problem: Problem, root = process.cwd()): string {
  const file = path.relative(root, problem.file).replaceAll(path.sep, "/");
  const where = problem.line === null ? file : `${file}:${problem.line}`;
  return `${where} ${problem.message}`;
}
