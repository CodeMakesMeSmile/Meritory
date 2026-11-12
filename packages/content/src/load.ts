import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { TSchema } from "typebox";
import Value from "typebox/value";
import { type Document, isNode, LineCounter, parseDocument } from "yaml";
import {
  type CategorizedFact,
  CategoryFile,
  FactFile,
  ID_PATTERN,
  SOURCE_URL_PATTERN,
  TEXT_PATTERN,
} from "./fact.ts";
import { todayUtc } from "./recheck.ts";

export type Problem = { file: string; line: number | null; message: string };

/** A fact with where it's written, for reports that point back at it */
export type LoadedFact = CategorizedFact & {
  file: string;
  line: number | null;
};

export type TrackFacts = { facts: LoadedFact[]; problems: Problem[] };

const PATTERN_MESSAGES: Record<string, string> = {
  [ID_PATTERN]: "must be lowercase words joined by hyphens",
  [SOURCE_URL_PATTERN]: "must be an https link with no user name",
  [TEXT_PATTERN]: "must not hold control characters",
};

type Parsed = { data: unknown; lineAt: (pointer: string) => number | null };

function parse(file: string, text: string, problems: Problem[]): Parsed {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter });
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
    const node = doc.getIn(keys.slice(0, depth), true);
    if (isNode(node) && node.range) {
      return lineCounter.linePos(node.range[0]).line;
    }
  }
  return null;
}

function check<T>(
  schema: TSchema,
  file: string,
  parsed: Parsed,
  problems: Problem[],
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
    const where = error.instancePath.slice(1) || "the file";
    problems.push({
      file,
      line: parsed.lineAt(error.instancePath),
      message: `${where} ${message}`,
    });
  }
  return undefined;
}

async function readText(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function yamlFiles(dir: string): Promise<string[]> {
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

/**
 * Reads a track's `categories.yaml` and every file in `facts/`, and reports
 * each problem with its file and line. A track with no folder has no facts.
 */
export async function loadTrackFacts(
  trackDir: string,
  today: string = todayUtc(),
): Promise<TrackFacts> {
  const problems: Problem[] = [];
  const facts: LoadedFact[] = [];
  const factFiles = await yamlFiles(path.join(trackDir, "facts"));

  const categoriesFile = path.join(trackDir, "categories.yaml");
  const categoriesText = await readText(categoriesFile);
  if (categoriesText === undefined) {
    if (factFiles.length > 0) {
      problems.push({
        file: categoriesFile,
        line: null,
        message: "is missing, so no fact has a category to point to",
      });
    }
    return { facts, problems };
  }

  const categoriesParsed = parse(categoriesFile, categoriesText, problems);
  const categories =
    check<CategoryFile>(
      CategoryFile,
      categoriesFile,
      categoriesParsed,
      problems,
    ) ?? [];
  const categoryIds = new Set<string>();
  categories.forEach((category, index) => {
    if (categoryIds.has(category.id)) {
      problems.push({
        file: categoriesFile,
        line: categoriesParsed.lineAt(`/${index}/id`),
        message: `category ${category.id} is listed twice`,
      });
    }
    categoryIds.add(category.id);
  });

  const factIds = new Set<string>();
  for (const file of factFiles) {
    const parsed = parse(file, await readFile(file, "utf8"), problems);
    const factFile = check<FactFile>(FactFile, file, parsed, problems);
    if (!factFile) continue;

    if (!categoryIds.has(factFile.category)) {
      problems.push({
        file,
        line: parsed.lineAt("/category"),
        message: `category ${factFile.category} is not in categories.yaml`,
      });
    }
    factFile.facts.forEach((fact, index) => {
      if (factIds.has(fact.id)) {
        problems.push({
          file,
          line: parsed.lineAt(`/facts/${index}/id`),
          message: `fact ${fact.id} is used by another fact`,
        });
      }
      factIds.add(fact.id);
      if (fact.checkedOn > today) {
        problems.push({
          file,
          line: parsed.lineAt(`/facts/${index}/checkedOn`),
          message: `fact ${fact.id} was checked on ${fact.checkedOn}, which is after today`,
        });
      }
      facts.push({
        ...fact,
        category: factFile.category,
        file,
        line: parsed.lineAt(`/facts/${index}`),
      });
    });
  }

  return { facts, problems };
}

/** A problem as one line, like a compiler error */
export function formatProblem(problem: Problem, root = process.cwd()): string {
  const file = path.relative(root, problem.file).replaceAll(path.sep, "/");
  const where = problem.line === null ? file : `${file}:${problem.line}`;
  return `${where} ${problem.message}`;
}
