import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  CONTROL_ATTACKS,
  HTML_ATTACKS,
  URL_ATTACKS,
} from "@meritory/security-testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { loadRubrics } from "./rubrics.ts";
import { formatProblem, type Problem } from "./yaml-file.ts";

const criterion = (id: string, scoredBy = "self") => ({
  id,
  name: `The ${id}`,
  scoredBy,
  levels: [
    "Missing or wrong.",
    "Partly there.",
    "Sound, with one gap.",
    "Sound and complete.",
  ],
});

// Line numbers in the tests follow this layout: each criterion takes 8 lines
const rubric = (extra: Record<string, unknown> = {}) => ({
  id: "coding-practice",
  title: "Coding practice",
  criteria: [criterion("correctness", "tests"), criterion("complexity")],
  pass: { total: 6, lowest: 2 },
  ...extra,
});

/** A rubric with one criterion, whose highest total is 4 */
const single = (only: ReturnType<typeof criterion>) =>
  rubric({ criteria: [only], pass: { total: 3, lowest: 2 } });

let track: string;
let rubricsDir: string;

async function writeRubric(value: unknown, name = "coding-practice") {
  await mkdir(rubricsDir, { recursive: true });
  await writeFile(path.join(rubricsDir, `${name}.yaml`), stringify(value));
}

async function load() {
  const problems: Problem[] = [];
  const rubrics = await loadRubrics(track, problems);
  return {
    rubrics,
    lines: problems.map((problem) => formatProblem(problem, rubricsDir)),
  };
}

beforeEach(async () => {
  track = await mkdtemp(path.join(tmpdir(), "meritory-rubrics-"));
  rubricsDir = path.join(track, "rubrics");
});

afterEach(async () => {
  await rm(track, { recursive: true, force: true });
});

describe("rubrics", () => {
  it("loads a rubric by its file name", async () => {
    await writeRubric(rubric());
    const { rubrics, lines } = await load();
    expect(lines).toEqual([]);
    const loaded = rubrics.get("coding-practice");
    expect(loaded?.criteria.map((c) => [c.id, c.scoredBy])).toEqual([
      ["correctness", "tests"],
      ["complexity", "self"],
    ]);
    expect(loaded?.pass).toEqual({ total: 6, lowest: 2 });
    expect(loaded?.file).toBe(path.join(rubricsDir, "coding-practice.yaml"));
  });

  it("has no rubrics when the track has no rubrics folder", async () => {
    const { rubrics, lines } = await load();
    expect(lines).toEqual([]);
    expect(rubrics.size).toBe(0);
  });

  it("keeps a rubric with problems, so exercises don't call it missing", async () => {
    await writeRubric(rubric({ pass: { total: 99, lowest: 2 } }));
    const { rubrics, lines } = await load();
    expect(lines).toHaveLength(1);
    expect(rubrics.has("coding-practice")).toBe(true);
    expect(rubrics.get("coding-practice")).toBeUndefined();
  });

  it("refuses an id that doesn't match its file name", async () => {
    await writeRubric(rubric(), "practice");
    expect((await load()).lines).toEqual([
      "practice.yaml:1 id coding-practice must match its file name, practice",
    ]);
  });

  it.each([3, 5])("refuses a criterion with %i levels", async (count) => {
    const levels = ["One.", "Two.", "Three.", "Four.", "Five."].slice(0, count);
    await writeRubric(single({ ...criterion("correctness", "tests"), levels }));
    expect((await load()).lines).toEqual([
      `coding-practice.yaml:7 criterion correctness must describe 4 levels, from 1 to 4, not ${count}`,
    ]);
  });

  it.each(["", "   "])(
    "refuses a level with no description, %j",
    async (text) => {
      const correctness = criterion("correctness", "tests");
      correctness.levels[2] = text;
      await writeRubric(single(correctness));
      expect((await load()).lines).toEqual([
        "coding-practice.yaml:10 criterion correctness level 3 is empty",
      ]);
    },
  );

  it("refuses a criterion listed twice", async () => {
    await writeRubric(
      rubric({
        criteria: [
          criterion("correctness", "tests"),
          criterion("complexity"),
          criterion("correctness"),
        ],
      }),
    );
    expect((await load()).lines).toEqual([
      "coding-practice.yaml:20 criterion correctness is listed twice",
    ]);
  });

  it("refuses a scorer that isn't tests or self", async () => {
    await writeRubric(single(criterion("correctness", "ai")));
    expect((await load()).lines).toEqual([
      "coding-practice.yaml:6 criteria/0/scoredBy must be tests or self",
    ]);
  });

  it("refuses a pass total the rubric can't reach", async () => {
    await writeRubric(rubric({ pass: { total: 9, lowest: 2 } }));
    expect((await load()).lines).toEqual([
      "coding-practice.yaml:21 pass/total 9 is more than the highest total, 8",
    ]);
  });

  it.each([0, 5])("refuses a lowest level of %i", async (lowest) => {
    await writeRubric(rubric({ pass: { total: 6, lowest } }));
    expect((await load()).lines).toEqual([
      "coding-practice.yaml:22 pass/lowest must be a level from 1 to 4",
    ]);
  });

  it.each([
    ...HTML_ATTACKS.filter((attack) => attack.includes("<")).map((attack) => [
      attack,
      "criterion correctness level 1 must not hold raw HTML",
    ]),
    ...URL_ATTACKS.filter((attack) => !attack.startsWith("https://")).map(
      (attack) => [
        `[See](${attack})`,
        `criterion correctness level 1 link ${JSON.stringify(attack)} must start with https:// or #`,
      ],
    ),
    ...CONTROL_ATTACKS.map((attack) => [
      attack,
      "criteria/0/levels/0 must not hold control characters",
    ]),
  ])("refuses %j in a level", async (attack, message) => {
    const correctness = criterion("correctness", "tests");
    correctness.levels[0] = attack;
    await writeRubric(single(correctness));
    expect((await load()).lines).toEqual([`coding-practice.yaml:8 ${message}`]);
  });
});
