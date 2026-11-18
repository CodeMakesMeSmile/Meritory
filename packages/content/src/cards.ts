import Type from "typebox";
import { CARD_SCHEMAS, type Card } from "./card.ts";
import type { ChapterFile } from "./chapter.ts";
import { markdownProblems } from "./explanation.ts";
import { ID_PATTERN } from "./fact.ts";
import {
  checkSchema,
  type Parsed,
  type Problem,
  parseYaml,
  readText,
} from "./yaml-file.ts";

/** A chapter's cards, each with its place in the file for line numbers */
export type LoadedCards = {
  cards: { card: Card; index: number }[];
  lineAt: (pointer: string) => number | null;
};

const CardList = Type.Array(Type.Unknown(), { minItems: 1 });

const SAFE_ID = new RegExp(ID_PATTERN);

// Names, ids, and links, which are plain text rather than CommonMark
const PLAIN_FIELDS = new Set([
  "id",
  "skill",
  "asks",
  "type",
  "title",
  "term",
  "matchHeading",
  "url",
]);

/** Reads and checks one chapter's `cards.yaml`, or returns undefined if there's none */
export async function loadCards(
  file: string,
  problems: Problem[],
): Promise<LoadedCards | undefined> {
  const text = await readText(file);
  if (text === undefined) return undefined;
  const parsed = parseYaml(file, text, problems);
  const loaded: LoadedCards = { cards: [], lineAt: parsed.lineAt };
  const list = checkSchema<unknown[]>(CardList, file, parsed, problems);
  if (!list) return loaded;

  list.forEach((item, index) => {
    const at = (pointer: string) => parsed.lineAt(`/${index}${pointer}`);
    const fields = isRecord(item) ? item : {};
    // An id is only printed once it's known to be safe to show
    const id = typeof fields.id === "string" ? fields.id : "";
    const name = `card ${SAFE_ID.test(id) ? id : index + 1}`;
    const type = fields.type;
    if (typeof type !== "string" || !Object.hasOwn(CARD_SCHEMAS, type)) {
      problems.push({
        file,
        line: at("/type"),
        message: `${name} type must be prompt, ordering, matching, or pick-one`,
      });
      return;
    }
    const schema = CARD_SCHEMAS[type as keyof typeof CARD_SCHEMAS];
    const itemParsed: Parsed = { data: item, lineAt: at };
    const card = checkSchema<Card>(schema, file, itemParsed, problems, name);
    if (!card) return;
    checkCard(file, card, at, problems);
    loaded.cards.push({ card, index });
  });
  return loaded;
}

/** Checks that cards fit their chapter and that every skill is asked why or when */
export function checkChapterCards(
  file: string,
  chapter: ChapterFile,
  loaded: LoadedCards,
  problems: Problem[],
) {
  const skills = new Set(chapter.skills.map((skill) => skill.id));
  for (const { card, index } of loaded.cards) {
    if (!skills.has(card.skill)) {
      problems.push({
        file,
        line: loaded.lineAt(`/${index}/skill`),
        message: `skill ${card.skill} is not in this chapter`,
      });
    }
  }
  for (const skill of chapter.skills) {
    const asked = loaded.cards.some(
      ({ card }) =>
        card.skill === skill.id &&
        (card.asks === "why" || card.asks === "when"),
    );
    if (!asked) {
      problems.push({
        file,
        line: null,
        message: `skill ${skill.id} has no card that asks why or when`,
      });
    }
  }
}

function checkCard(
  file: string,
  card: Card,
  at: (pointer: string) => number | null,
  problems: Problem[],
) {
  const add = (pointer: string, message: string) =>
    problems.push({ file, line: at(pointer), message });

  if (same(card.prompt, card.reworded)) {
    add("/reworded", "reworded must ask the prompt in other words");
  }

  switch (card.type) {
    case "ordering":
      findRepeats(card.steps, (i) => `/steps/${i}`, "step", add);
      break;
    case "matching": {
      const pairs = card.pairs.length;
      findRepeats(
        card.pairs.map((pair) => pair.item),
        (i) => `/pairs/${i}/item`,
        "item",
        add,
      );
      // The pairs' matches come first, then the extra ones
      findRepeats(
        [...card.pairs.map((pair) => pair.match), ...(card.extraMatches ?? [])],
        (i) => (i < pairs ? `/pairs/${i}/match` : `/extraMatches/${i - pairs}`),
        "match",
        add,
      );
      break;
    }
    case "pick-one": {
      findRepeats(
        card.options.map((option) => option.text),
        (i) => `/options/${i}/text`,
        "option",
        add,
      );
      const correct = card.options.filter((option) => option.correct).length;
      if (correct !== 1) {
        add(
          "/options",
          `card ${card.id} must have exactly one correct option, not ${correct}`,
        );
      }
      break;
    }
  }

  for (const [pointer, text] of markdownFields(card)) {
    // One opening and one closing tag would otherwise be reported twice
    const messages = new Set(markdownProblems(text).map((p) => p.message));
    for (const message of messages) {
      add(pointer, `${pointer.slice(1)} ${message}`);
    }
  }
}

// Reports each text that repeats an earlier one, ignoring case and spacing
function findRepeats(
  texts: string[],
  pointerOf: (index: number) => string,
  what: string,
  add: (pointer: string, message: string) => void,
) {
  const seen = new Set<string>();
  texts.forEach((text, index) => {
    const key = normalize(text);
    if (seen.has(key)) {
      const pointer = pointerOf(index);
      add(pointer, `${pointer.slice(1)} repeats an earlier ${what}`);
    }
    seen.add(key);
  });
}

function markdownFields(card: Card): [string, string][] {
  const fields: [string, string][] = [];
  const walk = (value: unknown, pointer: string, key: string) => {
    if (typeof value === "string") {
      if (!PLAIN_FIELDS.has(key)) fields.push([pointer, value]);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, `${pointer}/${index}`, key);
      });
    } else if (isRecord(value)) {
      for (const [name, item] of Object.entries(value)) {
        walk(item, `${pointer}/${name}`, name);
      }
    }
  };
  walk(card, "", "");
  return fields;
}

function normalize(text: string): string {
  return text.trim().replaceAll(/\s+/g, " ").toLowerCase();
}

function same(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
