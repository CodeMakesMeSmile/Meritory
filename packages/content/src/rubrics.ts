import path from "node:path";
import { markdownProblems } from "./explanation.ts";
import { type Criterion, LEVELS, RubricFile } from "./rubric.ts";
import { type Problem, readYamlFile, yamlFiles } from "./yaml-file.ts";

/** A rubric with the file it's written in */
export type LoadedRubric = RubricFile & { file: string };

/**
 * A track's rubrics by file name, which exercises use to name them. A rubric
 * whose file has problems maps to undefined, so it isn't reported as missing.
 */
export type TrackRubrics = Map<string, LoadedRubric | undefined>;

/** Reads every rubric in a track's `rubrics/` folder, which may be absent */
export async function loadRubrics(
  trackDir: string,
  problems: Problem[],
): Promise<TrackRubrics> {
  const rubrics: TrackRubrics = new Map();
  for (const file of await yamlFiles(path.join(trackDir, "rubrics"))) {
    // File names can't repeat, so neither can the ids that must match them
    const name = path.basename(file, ".yaml");
    const found: Problem[] = [];
    const read = await readYamlFile<RubricFile>(RubricFile, file, found);
    const rubric = read?.value;
    if (read && rubric) {
      const add = (pointer: string, message: string) =>
        found.push({ file, line: read.parsed.lineAt(pointer), message });
      if (rubric.id !== name) {
        add("/id", `id ${rubric.id} must match its file name, ${name}`);
      }
      checkCriteria(rubric.criteria, add);
      checkPass(rubric, add);
    }
    problems.push(...found);
    rubrics.set(
      name,
      rubric && found.length === 0 ? { ...rubric, file } : undefined,
    );
  }
  return rubrics;
}

function checkCriteria(
  criteria: Criterion[],
  add: (pointer: string, message: string) => void,
) {
  const seen = new Set<string>();
  criteria.forEach((criterion, index) => {
    const at = `/criteria/${index}`;
    if (seen.has(criterion.id)) {
      add(`${at}/id`, `criterion ${criterion.id} is listed twice`);
    }
    seen.add(criterion.id);

    const { levels } = criterion;
    if (levels.length !== LEVELS) {
      add(
        `${at}/levels`,
        `criterion ${criterion.id} must describe ${LEVELS} levels, from 1 to ${LEVELS}, not ${levels.length}`,
      );
    }
    levels.forEach((text, level) => {
      const where = `${at}/levels/${level}`;
      if (text.trim() === "") {
        add(where, `criterion ${criterion.id} level ${level + 1} is empty`);
        return;
      }
      // One opening and one closing tag would otherwise be reported twice
      const messages = new Set(markdownProblems(text).map((p) => p.message));
      for (const message of messages) {
        add(where, `criterion ${criterion.id} level ${level + 1} ${message}`);
      }
    });
  });
}

function checkPass(
  rubric: RubricFile,
  add: (pointer: string, message: string) => void,
) {
  const { total, lowest } = rubric.pass;
  if (lowest < 1 || lowest > LEVELS) {
    add("/pass/lowest", `pass/lowest must be a level from 1 to ${LEVELS}`);
  }
  const highest = rubric.criteria.length * LEVELS;
  if (total > highest) {
    add(
      "/pass/total",
      `pass/total ${total} is more than the highest total, ${highest}`,
    );
  }
}
