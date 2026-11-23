import path from "node:path";
import type { ChapterFile } from "./chapter.ts";
import {
  ANSWER_FILE,
  ClassSignature,
  ExerciseFile,
  FunctionSignature,
  type Param,
  type Signature,
  SOLUTION_FILE,
  SOLUTION_FILES,
  SOLUTION_LANGUAGES,
  type SolutionLanguage,
  type TestCase,
} from "./exercise.ts";
import { checkExplanation } from "./explanation.ts";
import type { TrackRubrics } from "./rubrics.ts";
import {
  checkCases,
  checkLock,
  LOCK_FILE,
  readCases,
  readLock,
} from "./test-cases.ts";
import { isListType } from "./values.ts";
import {
  checkSchema,
  type Problem,
  readText,
  readYamlFile,
  subfolders,
} from "./yaml-file.ts";

type LoadedBase = Omit<ExerciseFile, "kind" | "signature"> & {
  statement: string;
  dir: string;
};

/** A coding exercise with its statement, its cases, and where it's written */
export type CodingExercise = LoadedBase & {
  kind: "coding";
  signature: Signature;
  cases: TestCase[];
};

/** A design exercise with its statement, its model answer, and where it's written */
export type DesignExercise = LoadedBase & {
  kind: "design";
  answer: string;
};

export type LoadedExercise = CodingExercise | DesignExercise;

/** Where each exercise's sibling is named, for reporting */
type SiblingLine = {
  id: string;
  kind: ExerciseFile["kind"];
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
  rubrics: TrackRubrics,
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
    const statement = await readMarkdown(
      path.join(dir, "statement.md"),
      problems,
    );

    const exercise = read.value;
    if (!exercise) continue;
    const at = read.parsed.lineAt;
    const add = (pointer: string, message: string) =>
      problems.push({ file, line: at(pointer), message });
    if (exercise.id !== folder) {
      add("/id", `id ${exercise.id} must match its folder name, ${folder}`);
    }
    const owner = ids.exercises.get(exercise.id);
    if (owner !== undefined) {
      add("/id", `exercise ${exercise.id} is also in ${owner}`);
    } else {
      ids.exercises.set(exercise.id, chapter.id);
    }
    exercise.skills.forEach((skill, index) => {
      if (!skills.has(skill)) {
        add(`/skills/${index}`, `skill ${skill} is not in this chapter`);
      }
    });
    checkRubric(exercise, rubrics, add);

    const { id, kind, sibling, signature: data, ...rest } = exercise;
    siblings.push({ id, kind, sibling, file, line: at("/sibling") });
    const base = { ...rest, id, sibling, statement: statement ?? "", dir };

    if (kind === "design") {
      if (data !== undefined) {
        add("/signature", "a design exercise has no signature");
      }
      if (exercise.languages !== undefined) {
        add("/languages", "a design exercise has no languages");
      }
      await checkNoCodingFiles(dir, problems);
      const answer = await readMarkdown(path.join(dir, ANSWER_FILE), problems);
      exercises.push({ ...base, kind, answer: answer ?? "" });
      continue;
    }

    await checkSolutions(dir, exercise.languages, problems);
    if (data === undefined) add("/kind", "a coding exercise needs a signature");
    const signature = data && readSignature(file, data, at, problems);
    const cases = await loadCases(dir, id, signature, ids, problems);
    if (signature) exercises.push({ ...base, kind, signature, cases });
  }

  checkSiblings(siblings, problems);
  return exercises;
}

/** Reads a CommonMark file and checks it like an explanation */
async function readMarkdown(
  file: string,
  problems: Problem[],
): Promise<string | undefined> {
  const text = await readText(file);
  if (text === undefined) {
    problems.push({ file, line: null, message: "is missing" });
  } else {
    checkExplanation(file, text, problems);
  }
  return text;
}

function checkRubric(
  exercise: ExerciseFile,
  rubrics: TrackRubrics,
  add: (pointer: string, message: string) => void,
) {
  const name = exercise.rubric;
  if (!rubrics.has(name)) {
    add("/rubric", `rubric ${name} is not a rubric in this track`);
    return;
  }
  // Its own file already reports why it couldn't be read
  const rubric = rubrics.get(name);
  if (!rubric) return;

  const tested = rubric.criteria.some((c) => c.scoredBy === "tests");
  if (exercise.kind === "design" && tested) {
    add(
      "/rubric",
      `rubric ${name} has criteria scored by tests, which a design exercise can't run`,
    );
  } else if (exercise.kind === "coding" && !tested) {
    add(
      "/rubric",
      `rubric ${name} has no criterion scored by tests, which a coding exercise needs`,
    );
  }

  const criteria = new Set(rubric.criteria.map((c) => c.id));
  const seen = new Set<string>();
  (exercise.requires ?? []).forEach((criterion, index) => {
    const pointer = `/requires/${index}`;
    if (!criteria.has(criterion)) {
      add(pointer, `${criterion} is not a criterion in rubric ${name}`);
    } else if (seen.has(criterion)) {
      add(pointer, `${criterion} is listed twice`);
    }
    seen.add(criterion);
  });
}

async function checkSolutions(
  dir: string,
  languages: readonly SolutionLanguage[] | undefined,
  problems: Problem[],
) {
  const wanted: string[] = (languages ?? SOLUTION_LANGUAGES).map(
    (language) => SOLUTION_FILE[language],
  );
  // A solution for a language the exercise doesn't list would never be checked
  for (const name of SOLUTION_FILES) {
    if (wanted.includes(name)) continue;
    const file = path.join(dir, "solutions", name);
    if ((await readText(file)) !== undefined) {
      problems.push({
        file,
        line: null,
        message: "is for a language the exercise doesn't list",
      });
    }
  }
  for (const name of wanted) {
    const file = path.join(dir, "solutions", name);
    const solution = await readText(file);
    if (solution === undefined || solution.trim() === "") {
      problems.push({
        file,
        line: null,
        message: solution === undefined ? "is missing" : "is empty",
      });
    }
  }
}

// Cases and solutions would never run, so leaving them in is a mistake
async function checkNoCodingFiles(dir: string, problems: Problem[]) {
  const found = (await subfolders(dir)).includes("solutions")
    ? ["solutions"]
    : [];
  for (const name of ["cases.json", LOCK_FILE]) {
    if ((await readText(path.join(dir, name))) !== undefined) found.push(name);
  }
  for (const name of found.sort()) {
    problems.push({
      file: path.join(dir, name),
      line: null,
      message: "is only for coding exercises",
    });
  }
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
  // The runner only knows a hidden int as the place a list's tail links back to
  const hidden = signature.params.filter((p) => p.hidden);
  const list = signature.params.some((p) => p.type === "ListNode" && !p.hidden);
  if (hidden.length > 1 || hidden.some((p) => p.type !== "int" || !list)) {
    add(
      "/params",
      "hidden is only for one int parameter beside a ListNode parameter",
    );
  }
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
  for (const { id, kind, sibling, file, line } of siblings) {
    const other = byId.get(sibling);
    const message =
      sibling === id
        ? "an exercise can't be its own sibling"
        : !other
          ? `sibling ${sibling} is not an exercise in this chapter`
          : other.sibling !== id
            ? `sibling ${sibling} doesn't name ${id} as its sibling`
            : other.kind !== kind
              ? `sibling ${sibling} is a ${other.kind} exercise, so it can't pair with a ${kind} one`
              : undefined;
    if (message) problems.push({ file, line, message });
  }
}
