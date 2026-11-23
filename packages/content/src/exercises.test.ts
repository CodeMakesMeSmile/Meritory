import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CONTROL_ATTACKS, HTML_ATTACKS } from "@meritory/security-testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { loadTrackChapters } from "./chapters.ts";
import { lockTrack } from "./lock.ts";
import { addToLock, LOCK_FILE, readCases, readLock } from "./test-cases.ts";
import { formatProblem, subfolders } from "./yaml-file.ts";

const CHAPTER = `id: arrays
title: Arrays
order: 1
skills:
  - id: indexing
    name: Reading by index
`;

const CARDS = `- id: by-index
  skill: indexing
  asks: why
  type: prompt
  prompt: Why is reading by index fast?
  reworded: What makes reading by index quick?
  points:
    - The address comes from the index.
  lesson:
    title: Reading by index
    explanation: The address is the start plus the index times the item size.
`;

/** A version 4 uuid that's easy to tell apart in a test */
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const pairSignature = (name: string) => ({
  function: name,
  params: [
    { name: "nums", type: "int[]" },
    { name: "target", type: "int" },
  ],
  returns: "int[]",
  anyOrder: true,
});

const pairCase = (n: number, property = "twoSum", extra = {}) => ({
  uuid: uuid(n),
  description: `case ${n}`,
  property,
  input: { nums: [2, 7, 11, 15], target: 9 },
  expected: [0, 1],
  ...extra,
});

type Exercise = {
  id: string;
  sibling: string;
  signature: unknown;
  skills?: string[];
  cases: unknown[];
  rubric?: string;
  requires?: string[];
};

const criterion = (id: string, scoredBy: string) => ({
  id,
  name: `The ${id}`,
  scoredBy,
  levels: ["Missing.", "Partly there.", "Sound, with a gap.", "Complete."],
});

const CODING_RUBRIC = {
  id: "coding-practice",
  title: "Coding practice",
  criteria: [
    criterion("correctness", "tests"),
    criterion("complexity", "self"),
  ],
  pass: { total: 6, lowest: 2 },
};

const DESIGN_RUBRIC = {
  id: "design-review",
  title: "Design review",
  criteria: [
    criterion("requirements", "self"),
    criterion("trade-offs", "self"),
  ],
  pass: { total: 6, lowest: 2 },
};

let root: string;
let track: string;
let chapterDir: string;
let exercisesDir: string;

async function write(file: string, text: string) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
}

async function writeExercise(exercise: Exercise, dir = exercisesDir) {
  const at = (name: string) => path.join(dir, exercise.id, name);
  await write(
    at("exercise.yaml"),
    stringify({
      id: exercise.id,
      title: "An exercise",
      difficulty: "easy",
      skills: exercise.skills ?? ["indexing"],
      sibling: exercise.sibling,
      signature: exercise.signature,
      kind: "coding",
      rubric: exercise.rubric ?? "coding-practice",
      requires: exercise.requires,
    }),
  );
  await write(at("statement.md"), "# An exercise\n\nFind the pair.\n");
  for (const name of [
    "solution.ts",
    "solution.py",
    "Solution.java",
    "solution.c",
  ]) {
    await write(at(`solutions/${name}`), "// A reference solution\n");
  }
  await writeCases(exercise.id, exercise.cases, dir);
}

async function writeRubric(rubric: typeof CODING_RUBRIC) {
  await write(
    path.join(track, "rubrics", `${rubric.id}.yaml`),
    stringify(rubric),
  );
}

async function writeCases(id: string, cases: unknown[], dir = exercisesDir) {
  await write(
    path.join(dir, id, "cases.json"),
    JSON.stringify({ exercise: id, cases }, null, 2),
  );
}

/** Two linked exercises, with grouped cases and an error case, all locked */
async function writePair(twoSum: Partial<Exercise> = {}) {
  await writeExercise({
    id: "two-sum",
    sibling: "pair-gap",
    signature: pairSignature("twoSum"),
    cases: [
      pairCase(1),
      {
        description: "no pair",
        cases: [
          pairCase(2, "twoSum", {
            input: { nums: [1], target: 5 },
            expected: { error: "no pair" },
          }),
        ],
      },
    ],
    ...twoSum,
  });
  await writeExercise({
    id: "pair-gap",
    sibling: "two-sum",
    signature: pairSignature("pairGap"),
    cases: [pairCase(3, "pairGap")],
  });
}

async function problemLines(relativeTo = exercisesDir) {
  const { problems } = await loadTrackChapters(track);
  return problems.map((problem) => formatProblem(problem, relativeTo));
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "meritory-exercises-"));
  track = path.join(root, "dsa");
  chapterDir = path.join(track, "chapters", "arrays");
  exercisesDir = path.join(chapterDir, "exercises");
  await write(path.join(track, "track.yaml"), "id: dsa\ntitle: DSA\n");
  await write(path.join(chapterDir, "chapter.yaml"), CHAPTER);
  await write(path.join(chapterDir, "explanation.md"), "# Arrays\n\nText.\n");
  await write(path.join(chapterDir, "cards.yaml"), CARDS);
  await writeRubric(CODING_RUBRIC);
  await writeRubric(DESIGN_RUBRIC);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

// Locks every case as it is, so a test of a bad case sees only that case's problems
async function lockAll() {
  for (const exercise of await subfolders(exercisesDir)) {
    const dir = path.join(exercisesDir, exercise);
    const cases = await readCases(path.join(dir, "cases.json"), exercise, []);
    if (!cases || cases.length === 0) continue;
    const file = path.join(dir, LOCK_FILE);
    const { lock } = addToLock(await readLock(file, []), cases);
    await writeFile(file, JSON.stringify(lock));
  }
  await lockTrack(track);
}

describe("exercises", () => {
  it("loads a linked pair with grouped and error cases", async () => {
    await writePair();
    await lockAll();
    const { chapters, problems } = await loadTrackChapters(track);
    expect(problems).toEqual([]);
    const exercises = (chapters[0]?.exercises ?? []).filter(
      (e) => e.kind === "coding",
    );
    expect(
      exercises.map((e) => [e.id, e.sibling, e.rubric, e.cases.length]),
    ).toEqual([
      ["pair-gap", "two-sum", "coding-practice", 1],
      ["two-sum", "pair-gap", "coding-practice", 2],
    ]);
    expect(exercises[1]?.signature).toEqual(pairSignature("twoSum"));
  });

  it("has no exercises when the chapter has no exercises folder", async () => {
    const { chapters, problems } = await loadTrackChapters(track);
    expect(problems).toEqual([]);
    expect(chapters[0]?.exercises).toEqual([]);
  });

  it("needs only the solutions an exercise lists", async () => {
    await writePair();
    await lockAll();
    const file = path.join(exercisesDir, "pair-gap", "exercise.yaml");
    await write(
      file,
      `${await readFile(file, "utf8")}languages: [typescript, python]
`,
    );
    const solutions = path.join(exercisesDir, "pair-gap", "solutions");
    await rm(path.join(solutions, "solution.c"));
    expect(await problemLines()).toEqual([
      "pair-gap/solutions/Solution.java is for a language the exercise doesn't list",
    ]);
    await rm(path.join(solutions, "Solution.java"));
    expect(await problemLines()).toEqual([]);
    await rm(path.join(solutions, "solution.py"));
    expect(await problemLines()).toEqual([
      "pair-gap/solutions/solution.py is missing",
    ]);
  });

  it("reports a missing exercise file, statement, and solution", async () => {
    await writePair();
    await lockAll();
    await rm(path.join(exercisesDir, "two-sum", "exercise.yaml"));
    await rm(path.join(exercisesDir, "pair-gap", "statement.md"));
    await rm(path.join(exercisesDir, "pair-gap", "solutions", "solution.c"));
    await write(
      path.join(exercisesDir, "pair-gap", "solutions", "solution.py"),
      "\n",
    );
    expect(await problemLines()).toEqual([
      "pair-gap/statement.md is missing",
      "pair-gap/solutions/solution.py is empty",
      "pair-gap/solutions/solution.c is missing",
      "two-sum/exercise.yaml is missing",
      "pair-gap/exercise.yaml:6 sibling two-sum is not an exercise in this chapter",
    ]);
  });

  it.each([
    ...HTML_ATTACKS.filter((attack) => attack.includes("<")).map((attack) => [
      attack,
      "must not hold raw HTML",
    ]),
    [
      "[See](javascript:alert(1))",
      'link "javascript:alert(1)" must start with https:// or #',
    ],
    ...CONTROL_ATTACKS.filter((attack) => !attack.includes("\r\n")).map(
      (attack) => [attack, "must not hold control characters"],
    ),
  ])("refuses %j in a statement", async (attack, message) => {
    await writePair();
    await lockAll();
    await write(
      path.join(exercisesDir, "two-sum", "statement.md"),
      `# Two sum\n\n${attack}\n`,
    );
    expect(await problemLines()).toContain(`two-sum/statement.md:3 ${message}`);
  });

  it("reports an exercise with no sibling", async () => {
    await writePair();
    await lockAll();
    const file = path.join(exercisesDir, "two-sum", "exercise.yaml");
    const text = await readFile(file, "utf8");
    await writeFile(file, text.replace("sibling: pair-gap\n", ""));
    expect(await problemLines()).toEqual([
      "two-sum/exercise.yaml:1 the file must have required properties sibling",
      "pair-gap/exercise.yaml:6 sibling two-sum is not an exercise in this chapter",
    ]);
  });

  it("reports siblings that don't pair up", async () => {
    await writePair({ sibling: "two-sum" });
    await writeExercise({
      id: "pair-sum",
      sibling: "pair-gap",
      signature: pairSignature("pairSum"),
      cases: [pairCase(4, "pairSum")],
    });
    await lockAll();
    expect(await problemLines()).toEqual([
      "pair-gap/exercise.yaml:6 sibling two-sum doesn't name pair-gap as its sibling",
      "pair-sum/exercise.yaml:6 sibling pair-gap doesn't name pair-sum as its sibling",
      "two-sum/exercise.yaml:6 an exercise can't be its own sibling",
    ]);
  });

  it("reports a skill from another chapter", async () => {
    await writePair({ skills: ["indexing", "hashing"] });
    await lockAll();
    expect(await problemLines()).toEqual([
      "two-sum/exercise.yaml:6 skill hashing is not in this chapter",
    ]);
  });

  it("reports an exercise id used in two chapters", async () => {
    await writePair();
    const other = path.join(track, "chapters", "hashing");
    await write(
      path.join(other, "chapter.yaml"),
      CHAPTER.replace("id: arrays", "id: hashing")
        .replace("order: 1", "order: 2")
        .replace("id: indexing", "id: lookup"),
    );
    await write(path.join(other, "explanation.md"), "# Hashing\n\nText.\n");
    await write(
      path.join(other, "cards.yaml"),
      CARDS.replace("by-index", "lookup-card").replace(
        "skill: indexing",
        "skill: lookup",
      ),
    );
    const otherExercises = path.join(other, "exercises");
    await writeExercise(
      {
        id: "two-sum",
        sibling: "two-sum-again",
        skills: ["lookup"],
        signature: pairSignature("twoSum"),
        cases: [pairCase(5)],
      },
      otherExercises,
    );
    await writeExercise(
      {
        id: "two-sum-again",
        sibling: "two-sum",
        skills: ["lookup"],
        signature: pairSignature("twoSumAgain"),
        cases: [pairCase(6, "twoSumAgain")],
      },
      otherExercises,
    );
    await lockAll();
    expect(await problemLines(track)).toEqual([
      "chapters/hashing/exercises/two-sum/exercise.yaml:1 exercise two-sum is also in arrays",
    ]);
  });
});

describe("signatures", () => {
  async function signatureProblems(signature: unknown, cases?: unknown[]) {
    await writePair({ signature, ...(cases ? { cases } : {}) });
    await lockAll();
    return problemLines();
  }

  it("reports a type it doesn't know", async () => {
    expect(
      await signatureProblems({
        ...pairSignature("twoSum"),
        returns: "int[][][]",
      }),
    ).toEqual([
      "two-sum/exercise.yaml:14 returns must be void, or int, long, double, boolean, char, string, ListNode, or TreeNode, with up to two []",
    ]);
  });

  it("reports a parameter listed twice and skips its cases", async () => {
    const signature = pairSignature("twoSum");
    signature.params.push({ name: "nums", type: "int[]" });
    expect(await signatureProblems(signature)).toEqual([
      "two-sum/exercise.yaml:14 parameter nums is listed twice",
    ]);
  });

  it("accepts a hidden input the function never sees", async () => {
    const signature = {
      function: "hasCycle",
      params: [
        { name: "head", type: "ListNode" },
        { name: "pos", type: "int", hidden: true },
      ],
      returns: "boolean",
    };
    const cases = [
      {
        uuid: uuid(1),
        description: "a loop back to the start",
        property: "hasCycle",
        input: { head: [3, 2, 0, -4], pos: 1 },
        expected: true,
      },
    ];
    expect(await signatureProblems(signature, cases)).toEqual([]);
  });

  it.each([
    [
      "with no list beside it",
      [
        { name: "nums", type: "int[]" },
        { name: "pos", type: "int", hidden: true },
      ],
    ],
    [
      "that isn't an int",
      [
        { name: "head", type: "ListNode" },
        { name: "pos", type: "string", hidden: true },
      ],
    ],
    [
      "listed twice",
      [
        { name: "head", type: "ListNode" },
        { name: "pos", type: "int", hidden: true },
        { name: "skip", type: "int", hidden: true },
      ],
    ],
  ])("refuses a hidden parameter %s", async (_name, params) => {
    const signature = { function: "hasCycle", params, returns: "boolean" };
    expect(await signatureProblems(signature, [])).toContain(
      "two-sum/exercise.yaml:9 hidden is only for one int parameter beside a ListNode parameter",
    );
  });

  it("checks the changed parameter of a function that returns void", async () => {
    const signature = {
      function: "rotate",
      params: [
        { name: "nums", type: "int[]" },
        { name: "k", type: "int" },
      ],
      returns: "void",
      checks: "nums",
    };
    const cases = [
      {
        uuid: uuid(1),
        description: "rotate by two",
        property: "rotate",
        input: { nums: [1, 2, 3], k: 2 },
        expected: [2, 3, 1],
      },
      {
        uuid: uuid(2),
        description: "an answer of the wrong type",
        property: "rotate",
        input: { nums: [1], k: 0 },
        expected: 1,
      },
    ];
    expect(await signatureProblems(signature, cases)).toEqual([
      `two-sum/cases.json:23 case ${uuid(2)} expected must be int[]`,
    ]);
  });

  it.each([
    [
      { returns: "void" },
      "two-sum/exercise.yaml:7 a function that returns void must name the parameter it changes in checks",
    ],
    [
      { checks: "nums" },
      "two-sum/exercise.yaml:16 checks is only for functions that return void",
    ],
    [
      { returns: "int", anyOrder: true },
      "two-sum/exercise.yaml:15 anyOrder is only for answers that are lists",
    ],
  ])("reports a signature with %j", async (change, message) => {
    expect(
      await signatureProblems({ ...pairSignature("twoSum"), ...change }),
    ).toContain(message);
  });

  it("reports checks on a hidden parameter", async () => {
    const signature = {
      function: "rotate",
      params: [
        { name: "nums", type: "int[]" },
        { name: "k", type: "int", hidden: true },
      ],
      returns: "void",
      checks: "k",
    };
    expect(await signatureProblems(signature)).toContain(
      "two-sum/exercise.yaml:16 checks must name a parameter the function sees",
    );
  });
});

describe("design problems", () => {
  const cache = {
    class: "LruCache",
    params: [{ name: "capacity", type: "int" }],
    methods: [
      {
        name: "get",
        params: [{ name: "key", type: "int" }],
        returns: "int",
      },
      {
        name: "put",
        params: [
          { name: "key", type: "int" },
          { name: "value", type: "int" },
        ],
        returns: "void",
      },
    ],
  };

  const cacheCase = (input: unknown, expected: unknown) => ({
    uuid: uuid(1),
    description: "evicts the oldest key",
    property: "LruCache",
    input,
    expected,
  });

  async function designProblems(input: unknown, expected: unknown) {
    await writePair({ signature: cache, cases: [cacheCase(input, expected)] });
    await lockAll();
    return problemLines();
  }

  it("accepts calls, their arguments, and null for void", async () => {
    expect(
      await designProblems(
        {
          calls: ["LruCache", "put", "put", "get", "put", "get"],
          args: [[2], [1, 1], [2, 2], [1], [3, 3], [2]],
        },
        [null, null, null, 1, null, -1],
      ),
    ).toEqual([]);
  });

  it("reports calls that don't fit the class", async () => {
    expect(
      await designProblems(
        {
          calls: ["Cache", "put", "remove", "get"],
          args: [[2], [1], [1], ["1"]],
        },
        [null, 1, null, null],
      ),
    ).toEqual([
      `two-sum/cases.json:5 case ${uuid(1)} input/calls/0 must be LruCache`,
      `two-sum/cases.json:5 case ${uuid(1)} input/args/1 must have 2 values`,
      `two-sum/cases.json:5 case ${uuid(1)} input/calls/2 remove is not a method`,
      `two-sum/cases.json:5 case ${uuid(1)} input/args/3/0 must be int`,
      `two-sum/cases.json:5 case ${uuid(1)} expected/1 must be null`,
      `two-sum/cases.json:5 case ${uuid(1)} expected/3 must be int`,
    ]);
  });

  it.each([
    [{ calls: ["LruCache"], args: [] }, [null]],
    [{ calls: ["LruCache", "get"], args: [[2], [1]] }, [null]],
  ])(
    "reports calls and answers that don't line up",
    async (input, expected) => {
      const lines = await designProblems(input, expected);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(
        /(two lists of the same length|one value per call)$/,
      );
    },
  );

  it("refuses a case that expects an error", async () => {
    expect(
      await designProblems(
        { calls: ["LruCache", "get"], args: [[2], [1]] },
        { error: "no such key" },
      ),
    ).toEqual([
      `two-sum/cases.json:5 case ${uuid(1)} expected can't be an error for a class`,
    ]);
  });

  it("refuses hidden parameters", async () => {
    const signature = {
      ...cache,
      params: [{ name: "capacity", type: "int", hidden: true }],
    };
    await writePair({
      signature,
      cases: [cacheCase({ calls: ["LruCache"], args: [[1]] }, [null])],
    });
    await lockAll();
    expect(await problemLines()).toEqual([
      "two-sum/exercise.yaml:7 hidden parameters are only for functions",
    ]);
  });
});

describe("cases", () => {
  it("names the case when an input or answer doesn't fit", async () => {
    await writePair({
      cases: [
        pairCase(1, "pairSum", {
          input: { nums: [1, "2"], extra: 1 },
          expected: "0, 1",
        }),
      ],
    });
    await lockAll();
    const at = `two-sum/cases.json:5 case ${uuid(1)}`;
    expect(await problemLines()).toEqual([
      `${at} property must be twoSum`,
      `${at} input/extra is not a parameter`,
      `${at} input/nums must be int[]`,
      `${at} input is missing target`,
      `${at} expected must be int[]`,
    ]);
  });

  it("reports a case that doesn't follow the format", async () => {
    await writePair({
      cases: [
        // Names the next case's uuid before that case's own uuid line
        {
          ...pairCase(1),
          uuid: "not-a-uuid",
          note: "extra",
          reimplements: uuid(2),
        },
        {
          description: "no expected",
          uuid: uuid(2),
          property: "twoSum",
          input: {},
        },
      ],
    });
    await lockAll();
    expect(await problemLines()).toEqual([
      "two-sum/cases.json case at cases/0 note is not a known field",
      "two-sum/cases.json case at cases/0 uuid must be a lowercase version 4 uuid",
      `two-sum/cases.json:26 case ${uuid(2)} must have required properties expected`,
    ]);
  });

  it("reports a file that isn't JSON, or is for another exercise", async () => {
    await writePair();
    await lockAll();
    await write(path.join(exercisesDir, "two-sum", "cases.json"), "{ not json");
    await write(
      path.join(exercisesDir, "pair-gap", "cases.json"),
      JSON.stringify(
        { exercise: "two-sum", cases: [pairCase(3, "pairGap")] },
        null,
        2,
      ),
    );
    expect(await problemLines()).toEqual([
      "pair-gap/cases.json:2 exercise must match the exercise id, pair-gap",
      "two-sum/cases.json is not valid JSON",
      `two-sum/cases.lock.json case ${uuid(1)} was removed after it was locked, so put it back and add a new case that reimplements it`,
      `two-sum/cases.lock.json case ${uuid(2)} was removed after it was locked, so put it back and add a new case that reimplements it`,
    ]);
  });

  it("reports a uuid used twice in a file or a track", async () => {
    await writePair({ cases: [pairCase(1), pairCase(1), pairCase(3)] });
    await lockAll();
    expect(await problemLines()).toEqual([
      `two-sum/cases.json:5 case ${uuid(1)} is also in two-sum`,
      `two-sum/cases.json:41 case ${uuid(3)} is also in pair-gap`,
    ]);
  });

  it("checks what a fix reimplements", async () => {
    await writePair({
      cases: [
        pairCase(1),
        pairCase(2, "twoSum", { reimplements: uuid(1) }),
        pairCase(4, "twoSum", { reimplements: uuid(4) }),
        pairCase(5, "twoSum", { reimplements: uuid(9) }),
      ],
    });
    await lockAll();
    expect(await problemLines()).toEqual([
      `two-sum/cases.json:42 case ${uuid(4)} can't reimplement itself`,
      `two-sum/cases.json:61 case ${uuid(5)} reimplements ${uuid(9)}, which isn't a case in this file`,
    ]);
  });

  it("refuses a fix for a case that comes after it", async () => {
    await writePair({
      cases: [
        pairCase(1, "twoSum", { reimplements: uuid(2) }),
        pairCase(2, "twoSum", { reimplements: uuid(1) }),
      ],
    });
    await lockAll();
    expect(await problemLines()).toEqual([
      `two-sum/cases.json:5 case ${uuid(1)} reimplements ${uuid(2)}, which must come before it`,
    ]);
  });
});

describe("case lock", () => {
  it("asks for a lock when a case is new", async () => {
    await writePair();
    expect(await problemLines()).toEqual([
      `pair-gap/cases.json:5 case ${uuid(3)} isn't locked yet, so run pnpm content:lock`,
      `two-sum/cases.json:5 case ${uuid(1)} isn't locked yet, so run pnpm content:lock`,
      `two-sum/cases.json:26 case ${uuid(2)} isn't locked yet, so run pnpm content:lock`,
    ]);
  });

  it("refuses a locked case that changed, and keeps its old hash on relock", async () => {
    await writePair();
    await lockAll();
    const lockFile = path.join(exercisesDir, "two-sum", "cases.lock.json");
    const locked = await readFile(lockFile, "utf8");

    await writeCases("two-sum", [
      pairCase(1, "twoSum", { expected: [1, 0], description: "new words" }),
      pairCase(2, "twoSum", {
        input: { nums: [1], target: 5 },
        expected: { error: "no pair" },
        description: "only the description changed",
      }),
    ]);
    const relock = await lockTrack(track);
    expect(relock.written).toEqual([]);
    expect(await readFile(lockFile, "utf8")).toBe(locked);
    expect(await problemLines()).toEqual([
      `two-sum/cases.json:5 case ${uuid(1)} changed after it was locked, so undo the change and add a new case that reimplements it`,
    ]);
  });

  it("refuses a locked case that was removed", async () => {
    await writePair();
    await lockAll();
    await writeCases("two-sum", [pairCase(1)]);
    expect(await problemLines()).toEqual([
      `two-sum/cases.lock.json case ${uuid(2)} was removed after it was locked, so put it back and add a new case that reimplements it`,
    ]);
  });

  it("adds only new cases to the lock", async () => {
    await writePair();
    await lockAll();
    const lockFile = path.join(exercisesDir, "two-sum", "cases.lock.json");
    const before = JSON.parse(await readFile(lockFile, "utf8"));
    await writeCases("two-sum", [
      pairCase(1),
      pairCase(2, "twoSum", {
        input: { nums: [1], target: 5 },
        expected: { error: "no pair" },
      }),
      pairCase(7, "twoSum", { reimplements: uuid(1) }),
    ]);
    const result = await lockTrack(track);
    expect(
      result.written.map((w) => [path.basename(path.dirname(w.file)), w.added]),
    ).toEqual([["two-sum", 1]]);
    const after = JSON.parse(await readFile(lockFile, "utf8"));
    expect(after).toEqual({ ...before, [uuid(7)]: expect.any(String) });
    expect(await problemLines()).toEqual([]);
  });

  it("leaves a lock file it can't read alone", async () => {
    await writePair();
    const lockFile = path.join(exercisesDir, "two-sum", "cases.lock.json");
    await write(lockFile, '{ "not-a-uuid": "x" }');
    const result = await lockTrack(track);
    expect(result.problems.map((p) => formatProblem(p, exercisesDir))).toEqual([
      "two-sum/cases.lock.json must only map case uuids to their hashes",
      "../../../versions.json can't record versions while the track has problems",
    ]);
    expect(await readFile(lockFile, "utf8")).toBe('{ "not-a-uuid": "x" }');
  });
});

/** A design exercise, with fields after rubric starting on line 9 */
async function writeDesign(
  id: string,
  sibling: string,
  extra: Record<string, unknown> = {},
) {
  const at = (name: string) => path.join(exercisesDir, id, name);
  await write(
    at("exercise.yaml"),
    stringify({
      id,
      title: "A design exercise",
      difficulty: "medium",
      skills: ["indexing"],
      sibling,
      kind: "design",
      rubric: "design-review",
      ...extra,
    }),
  );
  await write(at("statement.md"), "# Design a link shortener\n\nScale it.\n");
  await write(at("answer.md"), "# Model answer\n\nA sketch of one design.\n");
}

describe("rubric links", () => {
  it("loads each exercise's rubric and the track's rubrics", async () => {
    await writePair({ requires: ["correctness"] });
    await lockAll();
    const { chapters, rubrics, problems } = await loadTrackChapters(track);
    expect(problems).toEqual([]);
    expect(rubrics.map((rubric) => rubric.id)).toEqual([
      "coding-practice",
      "design-review",
    ]);
    const twoSum = chapters[0]?.exercises.find((e) => e.id === "two-sum");
    expect([twoSum?.rubric, twoSum?.requires]).toEqual([
      "coding-practice",
      ["correctness"],
    ]);
  });

  it("reports a rubric that doesn't exist", async () => {
    await writePair({ rubric: "speed-run" });
    await lockAll();
    expect(await problemLines()).toEqual([
      "two-sum/exercise.yaml:17 rubric speed-run is not a rubric in this track",
    ]);
  });

  it("reports a broken rubric only in its own file", async () => {
    await writeRubric({ ...CODING_RUBRIC, pass: { total: 99, lowest: 2 } });
    await writePair();
    await lockAll();
    expect(await problemLines(track)).toEqual([
      "rubrics/coding-practice.yaml:21 pass/total 99 is more than the highest total, 8",
    ]);
  });

  it("refuses a coding exercise whose rubric has no tests", async () => {
    await writePair({ rubric: "design-review" });
    await lockAll();
    expect(await problemLines()).toEqual([
      "two-sum/exercise.yaml:17 rubric design-review has no criterion scored by tests, which a coding exercise needs",
    ]);
  });

  it("refuses a required criterion the rubric doesn't have, or one listed twice", async () => {
    await writePair({ requires: ["correctness", "speed", "correctness"] });
    await lockAll();
    expect(await problemLines()).toEqual([
      "two-sum/exercise.yaml:20 speed is not a criterion in rubric coding-practice",
      "two-sum/exercise.yaml:21 correctness is listed twice",
    ]);
  });

  it("reports a coding exercise with no signature", async () => {
    await writePair({ signature: undefined });
    await lockAll();
    expect(await problemLines()).toEqual([
      "two-sum/exercise.yaml:7 a coding exercise needs a signature",
    ]);
  });

  it("refuses a kind that isn't coding or design", async () => {
    await writeDesign("url-short", "paste-bin", { kind: "puzzle" });
    await writeDesign("paste-bin", "url-short");
    expect(await problemLines()).toEqual([
      "url-short/exercise.yaml:7 kind must be coding or design",
      "paste-bin/exercise.yaml:6 sibling url-short is not an exercise in this chapter",
    ]);
  });
});

describe("design exercises", () => {
  it("loads a linked pair with their model answers", async () => {
    await writeDesign("url-short", "paste-bin", { requires: ["trade-offs"] });
    await writeDesign("paste-bin", "url-short");
    const { chapters, problems } = await loadTrackChapters(track);
    expect(problems).toEqual([]);
    const exercises = chapters[0]?.exercises ?? [];
    expect(
      exercises.map((e) => [
        e.id,
        e.kind,
        e.kind === "design" ? e.answer : undefined,
        e.requires,
      ]),
    ).toEqual([
      [
        "paste-bin",
        "design",
        "# Model answer\n\nA sketch of one design.\n",
        undefined,
      ],
      [
        "url-short",
        "design",
        "# Model answer\n\nA sketch of one design.\n",
        ["trade-offs"],
      ],
    ]);
  });

  it("refuses a rubric with criteria scored by tests", async () => {
    await writeDesign("url-short", "paste-bin", { rubric: "coding-practice" });
    await writeDesign("paste-bin", "url-short");
    expect(await problemLines()).toEqual([
      "url-short/exercise.yaml:8 rubric coding-practice has criteria scored by tests, which a design exercise can't run",
    ]);
  });

  it("refuses a signature, cases, a lock, and solutions", async () => {
    await writeDesign("url-short", "paste-bin", {
      signature: pairSignature("shorten"),
    });
    await writeDesign("paste-bin", "url-short");
    const dir = path.join(exercisesDir, "url-short");
    await writeCases("url-short", [pairCase(1, "shorten")]);
    await write(path.join(dir, "cases.lock.json"), "{}\n");
    await write(path.join(dir, "solutions", "solution.ts"), "// Code\n");
    expect(await problemLines()).toEqual([
      "url-short/exercise.yaml:9 a design exercise has no signature",
      "url-short/cases.json is only for coding exercises",
      "url-short/cases.lock.json is only for coding exercises",
      "url-short/solutions is only for coding exercises",
    ]);
  });

  it("reports a missing model answer and statement", async () => {
    await writeDesign("url-short", "paste-bin");
    await writeDesign("paste-bin", "url-short");
    await rm(path.join(exercisesDir, "url-short", "answer.md"));
    await rm(path.join(exercisesDir, "paste-bin", "statement.md"));
    expect(await problemLines()).toEqual([
      "paste-bin/statement.md is missing",
      "url-short/answer.md is missing",
    ]);
  });

  it("refuses a sibling of the other kind", async () => {
    await writeExercise({
      id: "two-sum",
      sibling: "url-short",
      signature: pairSignature("twoSum"),
      cases: [pairCase(1)],
    });
    await writeDesign("url-short", "two-sum");
    await lockAll();
    expect(await problemLines()).toEqual([
      "two-sum/exercise.yaml:6 sibling url-short is a design exercise, so it can't pair with a coding one",
      "url-short/exercise.yaml:6 sibling two-sum is a coding exercise, so it can't pair with a design one",
    ]);
  });

  it.each([
    ...HTML_ATTACKS.filter((attack) => attack.includes("<")).map((attack) => [
      attack,
      "must not hold raw HTML",
    ]),
    [
      "[See](javascript:alert(1))",
      'link "javascript:alert(1)" must start with https:// or #',
    ],
    ...CONTROL_ATTACKS.filter((attack) => !attack.includes("\r\n")).map(
      (attack) => [attack, "must not hold control characters"],
    ),
  ])("refuses %j in a model answer", async (attack, message) => {
    await writeDesign("url-short", "paste-bin");
    await writeDesign("paste-bin", "url-short");
    await write(
      path.join(exercisesDir, "url-short", "answer.md"),
      `# Model answer\n\n${attack}\n`,
    );
    // An opening and closing tag are each reported, as in explanations
    expect(new Set(await problemLines())).toEqual(
      new Set([`url-short/answer.md:3 ${message}`]),
    );
  });
});
