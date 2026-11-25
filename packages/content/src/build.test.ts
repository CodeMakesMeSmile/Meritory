import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Value from "typebox/value";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { buildBundle } from "./build.ts";
import { Bundle } from "./bundle.ts";
import { lockTrack, versionsJson } from "./lock.ts";
import { canonicalJson } from "./values.ts";
import { formatProblem } from "./yaml-file.ts";

const SOLUTION = "// The reference solution, never sent to learners\n";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const criterion = (id: string, scoredBy: string) => ({
  id,
  name: `The ${id}`,
  scoredBy,
  levels: ["Missing.", "Partly there.", "Sound, with a gap.", "Complete."],
});

let contentDir: string;
let track: string;
let chapterDir: string;

async function write(file: string, text: string) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
}

async function writeCoding(id: string, sibling: string, name: string) {
  const dir = path.join(chapterDir, "exercises", id);
  await write(
    path.join(dir, "exercise.yaml"),
    stringify({
      id,
      kind: "coding",
      title: "Find a pair",
      difficulty: "easy",
      skills: ["indexing"],
      sibling,
      rubric: "coding-practice",
      signature: {
        function: name,
        params: [
          { name: "nums", type: "int[]" },
          { name: "target", type: "int" },
        ],
        returns: "int[]",
      },
    }),
  );
  await write(path.join(dir, "statement.md"), "# Find a pair\n\nTwo values.\n");
  const n = id === "two-sum" ? 1 : 2;
  await write(
    path.join(dir, "cases.json"),
    JSON.stringify({
      exercise: id,
      cases: [
        {
          uuid: uuid(n),
          description: "a pair",
          property: name,
          input: { nums: [2, 7], target: 9 },
          expected: [0, 1],
        },
      ],
    }),
  );
  for (const file of [
    "solution.ts",
    "solution.py",
    "Solution.java",
    "solution.c",
  ]) {
    await write(path.join(dir, "solutions", file), SOLUTION);
  }
}

async function writeDesign(id: string, sibling: string) {
  const dir = path.join(chapterDir, "exercises", id);
  await write(
    path.join(dir, "exercise.yaml"),
    stringify({
      id,
      kind: "design",
      title: "Design a service",
      difficulty: "medium",
      skills: ["indexing"],
      sibling,
      rubric: "design-review",
    }),
  );
  await write(path.join(dir, "statement.md"), "# Design it\n\nScale it.\n");
  await write(path.join(dir, "answer.md"), "# Model answer\n\nOne design.\n");
}

async function build() {
  const { bundle, problems } = await buildBundle(contentDir);
  return {
    bundle,
    lines: problems.map((problem) => formatProblem(problem, track)),
  };
}

/** Builds and returns the bundle, failing the test if there are problems */
async function built(): Promise<Bundle> {
  const { bundle, lines } = await build();
  expect(lines).toEqual([]);
  if (!bundle) throw new Error("no bundle");
  return bundle;
}

/** Every item's id with its hash and version, to compare two builds */
function versionsOf(bundle: Bundle) {
  const rows: [string, string, number][] = [];
  for (const t of bundle.tracks) {
    for (const chapter of t.chapters) {
      rows.push([`chapter/${chapter.id}`, chapter.hash, chapter.version]);
      for (const card of chapter.cards) {
        rows.push([`card/${card.id}`, card.hash, card.version]);
      }
      for (const exercise of chapter.exercises) {
        rows.push([`exercise/${exercise.id}`, exercise.hash, exercise.version]);
      }
    }
    for (const rubric of t.rubrics) {
      rows.push([`rubric/${rubric.id}`, rubric.hash, rubric.version]);
    }
  }
  return rows;
}

beforeEach(async () => {
  contentDir = await mkdtemp(path.join(tmpdir(), "meritory-build-"));
  track = path.join(contentDir, "dsa");
  chapterDir = path.join(track, "chapters", "arrays");
  await write(path.join(track, "track.yaml"), "id: dsa\ntitle: DSA\n");
  await write(
    path.join(chapterDir, "chapter.yaml"),
    stringify({
      id: "arrays",
      title: "Arrays",
      order: 1,
      skills: [{ id: "indexing", name: "Reading by index" }],
    }),
  );
  await write(path.join(chapterDir, "explanation.md"), "# Arrays\n\nText.\n");
  await write(
    path.join(chapterDir, "cards.yaml"),
    stringify([
      {
        id: "by-index",
        skill: "indexing",
        asks: "why",
        type: "prompt",
        prompt: "Why is reading by index fast?",
        reworded: "What makes reading by index quick?",
        points: ["The address comes from the index."],
        lesson: {
          title: "Reading by index",
          explanation: "Start plus offset.",
        },
      },
    ]),
  );
  await write(
    path.join(track, "rubrics", "coding-practice.yaml"),
    stringify({
      id: "coding-practice",
      title: "Coding practice",
      criteria: [criterion("correctness", "tests")],
      pass: { total: 3, lowest: 2 },
    }),
  );
  await write(
    path.join(track, "rubrics", "design-review.yaml"),
    stringify({
      id: "design-review",
      title: "Design review",
      criteria: [criterion("trade-offs", "self")],
      pass: { total: 3, lowest: 2 },
    }),
  );
  await writeCoding("two-sum", "pair-gap", "twoSum");
  await writeCoding("pair-gap", "two-sum", "pairGap");
  await writeDesign("url-short", "paste-bin");
  await writeDesign("paste-bin", "url-short");
  // Not tracks, or not ready, so they never reach the bundle
  await write(path.join(contentDir, "resources", "notes.yaml"), "x: [\n");
  await write(
    path.join(contentDir, "stack-decisions", "track.yaml"),
    "id: stack-decisions\ntitle: Stack decisions\n",
  );
});

afterEach(async () => {
  await rm(contentDir, { recursive: true, force: true });
});

describe("content bundle", () => {
  it("refuses to build until every item has a version", async () => {
    // Locks the cases, then drops the versions to start without any
    await lockTrack(track);
    await rm(path.join(track, "versions.json"));
    const { bundle, lines } = await build();
    expect(bundle).toBeUndefined();
    expect(lines).toEqual([
      "chapters/arrays/chapter.yaml chapter arrays has no version yet, so run pnpm content:lock",
      "chapters/arrays/cards.yaml card by-index has no version yet, so run pnpm content:lock",
      "chapters/arrays/exercises/pair-gap/exercise.yaml exercise pair-gap has no version yet, so run pnpm content:lock",
      "chapters/arrays/exercises/paste-bin/exercise.yaml exercise paste-bin has no version yet, so run pnpm content:lock",
      "chapters/arrays/exercises/two-sum/exercise.yaml exercise two-sum has no version yet, so run pnpm content:lock",
      "chapters/arrays/exercises/url-short/exercise.yaml exercise url-short has no version yet, so run pnpm content:lock",
      "rubrics/coding-practice.yaml rubric coding-practice has no version yet, so run pnpm content:lock",
      "rubrics/design-review.yaml rubric design-review has no version yet, so run pnpm content:lock",
    ]);
  });

  it("builds every item at version 1 once it's locked", async () => {
    const result = await lockTrack(track);
    expect(
      result.versions.map((v) => [path.basename(v.file), v.added]),
    ).toEqual([["versions.json", 8]]);
    const bundle = await built();
    expect(bundle.tracks.map((t) => t.id)).toEqual(["dsa"]);
    expect(
      versionsOf(bundle).map(([key, , version]) => [key, version]),
    ).toEqual([
      ["chapter/arrays", 1],
      ["card/by-index", 1],
      ["exercise/pair-gap", 1],
      ["exercise/paste-bin", 1],
      ["exercise/two-sum", 1],
      ["exercise/url-short", 1],
      ["rubric/coding-practice", 1],
      ["rubric/design-review", 1],
    ]);
    const twoSum = bundle.tracks[0]?.chapters[0]?.exercises.find(
      (e) => e.id === "two-sum",
    );
    expect(twoSum?.kind === "coding" && twoSum.cases.length).toBe(1);
    expect(bundle.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("builds a bundle that fits the bundle schema", async () => {
    await lockTrack(track);
    const bundle = await built();
    expect([...Value.Errors(Bundle, bundle)]).toEqual([]);
  });

  it("leaves out reference solutions, lock files, and file paths", async () => {
    await lockTrack(track);
    const text = canonicalJson(await built());
    const lock = await readFile(
      path.join(chapterDir, "exercises", "two-sum", "cases.lock.json"),
      "utf8",
    );
    const caseHash = Object.values(JSON.parse(lock))[0] as string;
    expect(text).not.toContain("reference solution");
    expect(text).not.toContain(caseHash);
    expect(text).not.toContain(contentDir.replaceAll("\\", "\\\\"));
    expect(text).not.toContain('"dir"');
    expect(text).not.toContain('"file"');
  });

  it("writes the same bytes when built twice", async () => {
    await lockTrack(track);
    const first = canonicalJson(await built());
    const second = canonicalJson(await built());
    expect(second).toBe(first);
  });

  it("changes only the edited exercise's version, after a lock", async () => {
    await lockTrack(track);
    const before = versionsOf(await built());

    await write(
      path.join(chapterDir, "exercises", "two-sum", "statement.md"),
      "# Find a pair\n\nTwo values that add up.\n",
    );
    expect((await build()).lines).toEqual([
      "chapters/arrays/exercises/two-sum/exercise.yaml exercise two-sum changed since its last version, so run pnpm content:lock",
    ]);

    const result = await lockTrack(track);
    expect(result.versions.map((v) => v.added)).toEqual([1]);
    const after = versionsOf(await built());
    const changed = after.filter(
      ([, hash], index) => hash !== before[index]?.[1],
    );
    expect(changed.map(([key, , version]) => [key, version])).toEqual([
      ["exercise/two-sum", 2],
    ]);
    expect(after.filter(([key]) => key !== "exercise/two-sum")).toEqual(
      before.filter(([key]) => key !== "exercise/two-sum"),
    );
  });

  it("keeps versions when a statement only gains Windows line endings", async () => {
    await lockTrack(track);
    const before = versionsOf(await built());
    await write(
      path.join(chapterDir, "exercises", "two-sum", "statement.md"),
      "# Find a pair\r\n\r\nTwo values.\r\n",
    );
    expect(versionsOf(await built())).toEqual(before);
  });

  it("records nothing new when nothing changed", async () => {
    await lockTrack(track);
    const versions = await readFile(path.join(track, "versions.json"), "utf8");
    const again = await lockTrack(track);
    expect([again.written, again.versions, again.problems]).toEqual([
      [],
      [],
      [],
    ]);
    expect(await readFile(path.join(track, "versions.json"), "utf8")).toBe(
      versions,
    );
  });

  it("won't record versions while the track has problems", async () => {
    await rm(path.join(chapterDir, "exercises", "url-short", "answer.md"));
    const result = await lockTrack(track);
    expect(result.problems.map((p) => formatProblem(p, track))).toEqual([
      "versions.json can't record versions while the track has problems",
    ]);
    expect(result.versions).toEqual([]);
    const { bundle, lines } = await build();
    expect(bundle).toBeUndefined();
    expect(lines).toContain(
      "chapters/arrays/exercises/url-short/answer.md is missing",
    );
  });

  it("leaves a case with a problem unlocked, so it can still be fixed", async () => {
    const dir = path.join(chapterDir, "exercises", "two-sum");
    const cases = (target: unknown) =>
      JSON.stringify({
        exercise: "two-sum",
        cases: [
          {
            uuid: uuid(1),
            description: "a pair",
            property: "twoSum",
            input: { nums: [2, 7], target },
            expected: [0, 1],
          },
        ],
      });
    await write(path.join(dir, "cases.json"), cases("9"));

    const result = await lockTrack(track);
    expect(result.problems.map((p) => formatProblem(p, track))).toContain(
      `chapters/arrays/exercises/two-sum/cases.json:1 case ${uuid(1)} input/target must be int`,
    );
    await expect(
      readFile(path.join(dir, "cases.lock.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
    // The other exercise had nothing wrong, so its case is locked
    expect(
      result.written.map((w) => path.basename(path.dirname(w.file))),
    ).toEqual(["pair-gap"]);

    await write(path.join(dir, "cases.json"), cases(9));
    const fixed = await lockTrack(track);
    expect(fixed.problems).toEqual([]);
    expect(fixed.written.map((w) => w.added)).toEqual([1]);
    await built();
  });

  it("refuses a versions file it can't read", async () => {
    await lockTrack(track);
    await write(
      path.join(track, "versions.json"),
      JSON.stringify({ "exercise/\u001b[31mx": ["nope"] }),
    );
    const { bundle, lines } = await build();
    expect(bundle).toBeUndefined();
    expect(lines).toContain(
      "versions.json must only map content items to lists of hashes",
    );
    const result = await lockTrack(track);
    expect(result.problems.map((p) => formatProblem(p, track))).toEqual([
      "versions.json must only map content items to lists of hashes",
    ]);
  });
});

describe("card chapters", () => {
  const listsDir = () => path.join(track, "chapters", "lists");
  const card = (id: string, skill: string, asks: string) => ({
    id,
    skill,
    asks,
    type: "prompt",
    prompt: `Why ${id}?`,
    reworded: `What makes ${id} work?`,
    points: ["A point."],
    lesson: { title: "A lesson", explanation: "Text." },
  });
  const writeCards = (dir: string, cards: object[]) =>
    write(path.join(dir, "cards.yaml"), stringify(cards));
  const readVersionsFile = async () =>
    JSON.parse(await readFile(path.join(track, "versions.json"), "utf8"));

  beforeEach(async () => {
    await write(
      path.join(listsDir(), "chapter.yaml"),
      stringify({
        id: "lists",
        title: "Lists",
        order: 2,
        skills: [{ id: "linking", name: "Following links" }],
      }),
    );
    await write(path.join(listsDir(), "explanation.md"), "# Lists\n\nText.\n");
    await writeCards(listsDir(), [
      card("next-pointer", "linking", "why"),
      card("head-first", "linking", "what"),
    ]);
  });

  it("records the chapter each card was locked in", async () => {
    const result = await lockTrack(track);
    expect(result.chapters.map((c) => c.added)).toEqual([3]);
    const versions = await readVersionsFile();
    expect(versions["card-chapter/by-index"]).toEqual(["arrays"]);
    expect(versions["card-chapter/head-first"]).toEqual(["lists"]);
    const again = await lockTrack(track);
    expect([again.versions, again.chapters]).toEqual([[], []]);
  });

  it("still builds from versions locked before chapters were recorded", async () => {
    await lockTrack(track);
    const versions = await readVersionsFile();
    const old = Object.fromEntries(
      Object.entries(versions).filter(([key]) => !key.startsWith("card-")),
    );
    await write(path.join(track, "versions.json"), JSON.stringify(old));
    await built();
    const result = await lockTrack(track);
    expect([result.versions, result.chapters.map((c) => c.added)]).toEqual([
      [],
      [3],
    ]);
  });

  it("refuses a card moved to another chapter until it gets a new id", async () => {
    await lockTrack(track);
    await writeCards(listsDir(), [card("next-pointer", "linking", "why")]);
    await writeCards(chapterDir, [
      card("by-index", "indexing", "why"),
      card("head-first", "indexing", "what"),
    ]);
    const moved =
      "chapters/arrays/cards.yaml card head-first was locked in chapter lists, so move it back or give it a new id";
    expect((await build()).lines).toContain(moved);
    const refused = await lockTrack(track);
    expect(refused.problems.map((p) => formatProblem(p, track))).toEqual([
      moved,
    ]);
    expect(refused.versions).toEqual([]);

    await writeCards(chapterDir, [
      card("by-index", "indexing", "why"),
      card("first-index", "indexing", "what"),
    ]);
    const relocked = await lockTrack(track);
    expect(relocked.problems).toEqual([]);
    expect((await readVersionsFile())["card-chapter/first-index"]).toEqual([
      "arrays",
    ]);
    await built();
  });
});

describe("versionsJson", () => {
  it("keeps short lists on one line and breaks long ones", () => {
    const hash = "a".repeat(64);
    expect(
      versionsJson({ "card-chapter/x": ["arrays"], "card/x": [hash, hash] }),
    ).toBe(
      `{\n  "card-chapter/x": ["arrays"],\n  "card/x": [\n    "${hash}",\n    "${hash}"\n  ]\n}\n`,
    );
  });

  it("writes an empty file as an empty object", () => {
    expect(versionsJson({})).toBe("{}\n");
  });
});

describe("track order", () => {
  /** A track with one chapter and one card, locked so it builds */
  async function smallTrack(id: string, order?: number) {
    const dir = path.join(contentDir, id);
    await write(
      path.join(dir, "track.yaml"),
      stringify({ id, title: `Track ${id}`, ...(order ? { order } : {}) }),
    );
    const chapter = path.join(dir, "chapters", `${id}-basics`);
    await write(
      path.join(chapter, "chapter.yaml"),
      stringify({
        id: `${id}-basics`,
        title: "Basics",
        order: 1,
        skills: [{ id: "basics", name: "The basics" }],
      }),
    );
    await write(path.join(chapter, "explanation.md"), "# Basics\n\nText.\n");
    await write(
      path.join(chapter, "cards.yaml"),
      await readFile(path.join(chapterDir, "cards.yaml"), "utf8").then((text) =>
        text
          .replaceAll("by-index", `${id}-card`)
          .replaceAll("indexing", "basics"),
      ),
    );
    await lockTrack(dir);
  }

  it("puts tracks in their order, then tracks without one by folder name", async () => {
    await write(
      path.join(track, "track.yaml"),
      "id: dsa\ntitle: DSA\norder: 2\n",
    );
    await lockTrack(track);
    await smallTrack("aaa");
    await smallTrack("zzz", 1);
    await smallTrack("bbb");
    const bundle = await built();
    expect(bundle.tracks.map((t) => [t.id, t.order])).toEqual([
      ["zzz", 1],
      ["dsa", 2],
      ["aaa", undefined],
      ["bbb", undefined],
    ]);
  });

  it("keeps folder order when no track has an order", async () => {
    await lockTrack(track);
    await smallTrack("aaa");
    const bundle = await built();
    expect(bundle.tracks.map((t) => t.id)).toEqual(["aaa", "dsa"]);
  });
});
