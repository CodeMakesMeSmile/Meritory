import { readFile } from "node:fs/promises";
import path from "node:path";
import { type CategorizedFact, CategoryFile, FactFile } from "./fact.ts";
import { todayUtc } from "./recheck.ts";
import {
  checkSchema,
  formatProblem,
  type Problem,
  parseYaml,
  readText,
  yamlFiles,
} from "./yaml-file.ts";

export { formatProblem, type Problem };

/** A fact with where it's written, for reports that point back at it */
export type LoadedFact = CategorizedFact & {
  file: string;
  line: number | null;
};

export type TrackFacts = { facts: LoadedFact[]; problems: Problem[] };

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

  const categoriesParsed = parseYaml(categoriesFile, categoriesText, problems);
  const categories =
    checkSchema<CategoryFile>(
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
    const parsed = parseYaml(file, await readFile(file, "utf8"), problems);
    const factFile = checkSchema<FactFile>(FactFile, file, parsed, problems);
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
