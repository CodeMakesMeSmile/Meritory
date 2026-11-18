import path from "node:path";
import type { ChapterFile } from "./chapter.ts";
import {
  ClassSignature,
  ExerciseFile,
  FunctionSignature,
  type Param,
  type Signature,
  SOLUTION_FILES,
} from "./exercise.ts";
import { checkExplanation } from "./explanation.ts";
import {
  checkCases,
  checkLock,
  LOCK_FILE,
  readCases,
  readLock,
  type TestCase,
} from "./test-cases.ts";
import { isListType } from "./values.ts";
import {
  checkSchema,
  type Problem,
  readText,
  readYamlFile,
  subfolders,
} from "./yaml-file.ts";

/** An exercise with its statement, its cases, and where it's written */
export type LoadedExercise = ExerciseFile & {
  statement: string;
  cases: TestCase[];
  dir: string;
};

/** Where each exercise's sibling is named, for reporting */
type SiblingLine = {
  id: string;
  sibling: string;
  file: string;
  line: number | null;
};

/** Ids used so far in a track, which must be unique across all its chapters */
export type TrackIds = {
  /** Exercise id to the chapter it's in */
  exercises: Map<string, string>;
  /** Case uuid to the exercise it's in */
  cases: Map<string, string>;
};

/** Reads every exercise in a chapter's `exercises/` folder, which may be absent */
export async function loadExercises(
  chapterDir: string,
  chapter: ChapterFile,
  ids: TrackIds,
  problems: Problem[],
): Promise<LoadedExercise[]> {
  const exercisesDir = path.join(chapterDir, "exercises");
  const exercises: LoadedExercise[] = [];
  const siblings: SiblingLine[] = [];
  const skills = new Set(chapter.skills.map((skill) => skill.id));

  for (const folder of await subfolders(exercisesDir)) {
    const dir = path.join(exercisesDir, folder);
    const file = path.join(dir, "exercise.yaml");
    const read = await readYamlFile<ExerciseFile>(ExerciseFile, file, problems);
    if (!read) {
      problems.push({ file, line: null, message: "is missing" });
      continue;
    }

    const statementFile = path.join(dir, "statement.md");
    const statement = await readText(statementFile);
    if (statement === undefined) {
      problems.push({ file: statementFile, line: null, message: "is missing" });
    } else {
      checkExplanation(statementFile, statement, problems);
    }

    for (const name of SOLUTION_FILES) {
      const solutionFile = path.join(dir, "solutions", name);
      const solution = await readText(solutionFile);
      if (solution === undefined || solution.trim() === "") {
        problems.push({
          file: solutionFile,
          line: null,
          message: solution === undefined ? "is missing" : "is empty",
        });
      }
    }

    const exercise = read.value;
    if (!exercise) continue;
    const at = read.parsed.lineAt;
    if (exercise.id !== folder) {
      problems.push({
        file,
        line: at("/id"),
        message: `id ${exercise.id} must match its folder name, ${folder}`,
      });
    }
    const owner = ids.exercises.get(exercise.id);
    if (owner !== undefined) {
      problems.push({
        file,
        line: at("/id"),
        message: `exercise ${exercise.id} is also in ${owner}`,
      });
    } else {
      ids.exercises.set(exercise.id, chapter.id);
    }
    exercise.skills.forEach((skill, index) => {
      if (!skills.has(skill)) {
        problems.push({
          file,
          line: at(`/skills/${index}`),
          message: `skill ${skill} is not in this chapter`,
        });
      }
    });

    const { id, sibling } = exercise;
    siblings.push({ id, sibling, file, line: at("/sibling") });
    const signature = readSignature(file, exercise.signature, at, problems);
    const cases = await loadCases(dir, id, signature, ids, problems);
    if (signature) {
      exercises.push({
        ...exercise,
        signature,
        statement: statement ?? "",
        cases,
        dir,
      });
    }
  }

  checkSiblings(siblings, problems);
  return exercises;
}

async function loadCases(
  dir: string,
  exerciseId: string,
  signature: Signature | undefined,
  ids: TrackIds,
  problems: Problem[],
): Promise<TestCase[]> {
  const casesFile = path.join(dir, "cases.json");
  const cases = await readCases(casesFile, exerciseId, problems);
  if (!cases) {
    problems.push({ file: casesFile, line: null, message: "is missing" });
    return [];
  }
  for (const { testCase, line } of cases) {
    const owner = ids.cases.get(testCase.uuid);
    if (owner !== undefined) {
      problems.push({
        file: casesFile,
        line,
        message: `case ${testCase.uuid} is also in ${owner}`,
      });
    } else {
      ids.cases.set(testCase.uuid, exerciseId);
    }
  }
  if (signature) checkCases(casesFile, signature, cases, problems);
  const lockFile = path.join(dir, LOCK_FILE);
  const lock = await readLock(lockFile, problems);
  checkLock(casesFile, lockFile, cases, lock, problems);
  return cases.map(({ testCase }) => testCase);
}

function readSignature(
  file: string,
  data: Record<string, unknown>,
  lineAt: (pointer: string) => number | null,
  problems: Problem[],
): Signature | undefined {
  const at = (pointer: string) => lineAt(`/signature${pointer}`);
  const isClass = "class" in data;
  const signature = checkSchema<Signature>(
    isClass ? ClassSignature : FunctionSignature,
    file,
    { data, lineAt: at },
    problems,
    "signature",
  );
  if (!signature) return undefined;

  // A signature with a name listed twice can't be called, so its cases aren't checked
  let callable = true;
  const add = (pointer: string, message: string) =>
    problems.push({ file, line: at(pointer), message });
  const repeated = (pointer: string, message: string) => {
    callable = false;
    add(pointer, message);
  };

  if ("class" in signature) {
    findRepeatedNames(signature.params, "/params", repeated);
    const methods = new Set<string>();
    signature.methods.forEach((method, index) => {
      if (methods.has(method.name)) {
        repeated(
          `/methods/${index}/name`,
          `method ${method.name} is listed twice`,
        );
      }
      methods.add(method.name);
      findRepeatedNames(method.params, `/methods/${index}/params`, repeated);
    });
    const hidden = [
      signature.params,
      ...signature.methods.map((m) => m.params),
    ].some((params) => params.some((param) => param.hidden));
    if (hidden) add("", "hidden parameters are only for functions");
    return callable ? signature : undefined;
  }

  findRepeatedNames(signature.params, "/params", repeated);
  const checked = signature.params.find((p) => p.name === signature.checks);
  if (signature.returns === "void" && !checked) {
    add(
      "/checks",
      "a function that returns void must name the parameter it changes in checks",
    );
  } else if (signature.returns !== "void" && signature.checks !== undefined) {
    add("/checks", "checks is only for functions that return void");
  } else if (checked?.hidden) {
    add("/checks", "checks must name a parameter the function sees");
  }
  const answer =
    signature.returns === "void" ? checked?.type : signature.returns;
  if (signature.anyOrder && !(answer && isListType(answer))) {
    add("/anyOrder", "anyOrder is only for answers that are lists");
  }
  return callable ? signature : undefined;
}

function findRepeatedNames(
  params: Param[],
  pointer: string,
  add: (pointer: string, message: string) => void,
) {
  const seen = new Set<string>();
  params.forEach((param, index) => {
    if (seen.has(param.name)) {
      add(
        `${pointer}/${index}/name`,
        `parameter ${param.name} is listed twice`,
      );
    }
    seen.add(param.name);
  });
}

function checkSiblings(siblings: SiblingLine[], problems: Problem[]) {
  const byId = new Map(siblings.map((s) => [s.id, s]));
  for (const { id, sibling, file, line } of siblings) {
    const other = byId.get(sibling);
    const message =
      sibling === id
        ? "an exercise can't be its own sibling"
        : !other
          ? `sibling ${sibling} is not an exercise in this chapter`
          : other.sibling !== id
            ? `sibling ${sibling} doesn't name ${id} as its sibling`
            : undefined;
    if (message) problems.push({ file, line, message });
  }
}
