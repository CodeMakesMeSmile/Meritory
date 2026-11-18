import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { HTML_ATTACKS, URL_ATTACKS } from "@meritory/security-testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadTrackChapters } from "./chapters.ts";
import { formatProblem } from "./yaml-file.ts";

const CHAPTER = `id: arrays
title: Arrays
order: 1
skills:
  - id: indexing
    name: Reading by index
`;

const LESSON = `  lesson:
    title: Reading by index
    explanation: The address is the start plus the index times the item size.
`;

/** One card as a YAML list item, with the fields every type shares */
function card(id: string, type: string, body: string, asks = "why") {
  return `- id: ${id}
  skill: indexing
  asks: ${asks}
  type: ${type}
  prompt: Question ${id}?
  reworded: The ${id} question in other words?
${body}${LESSON}`;
}

const POINTS = "  points:\n    - The address comes from the index.\n";

const STEPS = `  steps:
    - Work out the address
    - Read the memory
    - Return the value
`;

const PAIRS = `  matchHeading: Costs
  pairs:
    - item: Read by index
      match: Constant
    - item: Search unsorted
      match: Linear
`;

const OPTIONS = `  options:
    - text: Constant time
      correct: true
      reason: The address is worked out directly.
    - text: Linear time
      reason: Nothing is scanned.
`;

let root: string;
let chapterDir: string;

async function write(dir: string, name: string, text: string) {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), text);
}

async function writeCards(text: string) {
  await write(chapterDir, "cards.yaml", text);
}

async function problemLines() {
  const { problems } = await loadTrackChapters(path.join(root, "dsa"));
  return problems.map((problem) => formatProblem(problem, chapterDir));
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "meritory-cards-"));
  const track = path.join(root, "dsa");
  chapterDir = path.join(track, "chapters", "arrays");
  await write(track, "track.yaml", "id: dsa\ntitle: DSA\n");
  await write(chapterDir, "chapter.yaml", CHAPTER);
  await write(chapterDir, "explanation.md", "# Arrays\n\nText.\n");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("cards", () => {
  it("loads all four types with their optional parts", async () => {
    await writeCards(
      card(
        "by-index",
        "prompt",
        `${POINTS}  misconception: Arrays are always faster than lists.
  lesson:
    title: Reading by index
    explanation: The address is worked out, so nothing is scanned.
    happened: |
      You scanned the array from the start.
    fix: |
      \`\`\`ts
      const value = items[index];
      \`\`\`
    source:
      title: MDN Array
      url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
`,
      ).replace(LESSON, "") +
        card(
          "read-steps",
          "ordering",
          `${STEPS}  terms:
    - term: Address
      definition: Where an item sits in memory.
`,
          "what",
        ) +
        card(
          "costs",
          "matching",
          `${PAIRS}  extraMatches:
    - Quadratic
`,
          "when",
        ) +
        card("best-cost", "pick-one", OPTIONS),
    );
    const { chapters, problems } = await loadTrackChapters(
      path.join(root, "dsa"),
    );
    expect(problems).toEqual([]);
    expect(chapters[0]?.cards.map((c) => [c.id, c.type])).toEqual([
      ["by-index", "prompt"],
      ["read-steps", "ordering"],
      ["costs", "matching"],
      ["best-cost", "pick-one"],
    ]);
  });

  it("reports a missing cards file", async () => {
    expect(await problemLines()).toEqual(["cards.yaml is missing"]);
  });

  it("reports a cards file with no cards", async () => {
    await writeCards("[]\n");
    expect(await problemLines()).toEqual([
      "cards.yaml:1 the file must not have fewer than 1 items",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("reports a type it doesn't know", async () => {
    await writeCards(card("by-index", "flashcard", POINTS));
    expect(await problemLines()).toEqual([
      "cards.yaml:4 card by-index type must be prompt, ordering, matching, or pick-one",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("names a card by its place when its id isn't safe to print", async () => {
    await writeCards(
      card("by-index", "flashcard", POINTS).replace(
        "id: by-index",
        'id: "red\\e[31m"',
      ),
    );
    expect(await problemLines()).toEqual([
      "cards.yaml:4 card 1 type must be prompt, ordering, matching, or pick-one",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("reports an ordering card with no steps", async () => {
    await writeCards(card("read-steps", "ordering", ""));
    expect(await problemLines()).toEqual([
      "cards.yaml:1 card read-steps must have required properties steps",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("reports a field that belongs to another type", async () => {
    await writeCards(card("read-steps", "ordering", STEPS + POINTS));
    expect(await problemLines()).toEqual([
      "cards.yaml:11 points is not a known field",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("reports a list field on its key line", async () => {
    await writeCards(card("by-index", "prompt", "  points: []\n"));
    expect(await problemLines()).toEqual([
      "cards.yaml:7 points must not have fewer than 1 items",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("reports a card with no second wording or lesson", async () => {
    await writeCards(
      card("by-index", "prompt", POINTS)
        .replace("  reworded: The by-index question in other words?\n", "")
        .replace(LESSON, ""),
    );
    expect(await problemLines()).toEqual([
      "cards.yaml:1 card by-index must have required properties reworded, lesson",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("reports a second wording that only repeats the prompt", async () => {
    await writeCards(
      card("by-index", "prompt", POINTS).replace(
        "The by-index question in other words?",
        "  question BY-INDEX? ",
      ),
    );
    expect(await problemLines()).toEqual([
      "cards.yaml:6 reworded must ask the prompt in other words",
    ]);
  });

  it("reports a skill with no why or when card", async () => {
    await writeCards(card("read-steps", "ordering", STEPS, "what"));
    expect(await problemLines()).toEqual([
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("reports a card for a skill in another chapter", async () => {
    await writeCards(
      card("by-index", "prompt", POINTS) +
        card("hash-cost", "prompt", POINTS).replace(
          "skill: indexing",
          "skill: hashing",
        ),
    );
    expect(await problemLines()).toEqual([
      "cards.yaml:13 skill hashing is not in this chapter",
    ]);
  });

  it("reports a card id used twice in the track", async () => {
    const other = path.join(root, "dsa", "chapters", "lists");
    await write(
      other,
      "chapter.yaml",
      CHAPTER.replace("id: arrays", "id: lists")
        .replace("order: 1", "order: 2")
        .replace("id: indexing", "id: walking"),
    );
    await write(other, "explanation.md", "# Lists\n\nText.\n");
    await write(
      other,
      "cards.yaml",
      card("by-index", "prompt", POINTS).replace(
        "skill: indexing",
        "skill: walking",
      ),
    );
    await writeCards(card("by-index", "prompt", POINTS));
    const { problems } = await loadTrackChapters(path.join(root, "dsa"));
    expect(problems.map((p) => formatProblem(p, root))).toEqual([
      "dsa/chapters/lists/cards.yaml:1 card by-index is also in arrays",
    ]);
  });

  it("reports repeated steps, matches, and options", async () => {
    await writeCards(
      card(
        "read-steps",
        "ordering",
        `${STEPS}    - read the  memory\n`,
        "what",
      ) +
        card(
          "costs",
          "matching",
          `${PAIRS}    - item: read by index
      match: Linear
  extraMatches:
    - constant
`,
          "what",
        ) +
        card(
          "best-cost",
          "pick-one",
          `${OPTIONS}    - text: Constant  time\n      reason: Repeated.\n`,
        ),
    );
    expect(await problemLines()).toEqual([
      "cards.yaml:11 steps/3 repeats an earlier step",
      "cards.yaml:27 pairs/2/item repeats an earlier item",
      "cards.yaml:28 pairs/2/match repeats an earlier match",
      "cards.yaml:30 extraMatches/0 repeats an earlier match",
      "cards.yaml:46 options/2/text repeats an earlier option",
    ]);
  });

  it.each([
    ["no correct option", OPTIONS.replace("      correct: true\n", ""), 0],
    [
      "two correct options",
      OPTIONS.replace(
        "      reason: Nothing is scanned.",
        "      correct: true\n      reason: Nothing is scanned.",
      ),
      2,
    ],
  ])("reports a pick-one card with %s", async (_name, options, count) => {
    await writeCards(card("best-cost", "pick-one", options));
    expect(await problemLines()).toEqual([
      `cards.yaml:7 card best-cost must have exactly one correct option, not ${count}`,
    ]);
  });

  it.each(HTML_ATTACKS.filter((attack) => attack.includes("<")))(
    "refuses raw HTML %s in card text",
    async (attack) => {
      await writeCards(
        card("by-index", "prompt", POINTS).replace(
          "The address comes from the index.",
          JSON.stringify(attack),
        ),
      );
      expect(await problemLines()).toEqual([
        "cards.yaml:8 points/0 must not hold raw HTML",
      ]);
    },
  );

  it("refuses raw HTML in a lesson's fix", async () => {
    await writeCards(
      card("by-index", "prompt", POINTS).replace(
        LESSON,
        `${LESSON}    fix: <b>Use the index</b>\n`,
      ),
    );
    expect(await problemLines()).toEqual([
      "cards.yaml:12 lesson/fix must not hold raw HTML",
    ]);
  });

  it.each(URL_ATTACKS.filter((attack) => !attack.startsWith("https://")))(
    "refuses a link to %s in card text",
    async (attack) => {
      await writeCards(
        card(
          "by-index",
          "prompt",
          `${POINTS}  misconception: ${JSON.stringify(`[See](${attack})`)}\n`,
        ),
      );
      const lines = await problemLines();
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(/^cards\.yaml:9 misconception /);
    },
  );

  it("refuses a lesson source that isn't https", async () => {
    await writeCards(
      card("by-index", "prompt", POINTS).replace(
        LESSON,
        `${LESSON}    source:\n      title: Docs\n      url: http://example.com\n`,
      ),
    );
    expect(await problemLines()).toEqual([
      "cards.yaml:14 lesson/source/url must be an https link with no user name",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });

  it("refuses control characters in card text", async () => {
    await writeCards(
      card("by-index", "prompt", POINTS).replace(
        "Question by-index?",
        '"Question \\a by-index?"',
      ),
    );
    expect(await problemLines()).toEqual([
      "cards.yaml:5 prompt must not hold control characters",
      "cards.yaml skill indexing has no card that asks why or when",
    ]);
  });
});
