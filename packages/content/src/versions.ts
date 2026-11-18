import { createHash } from "node:crypto";
import path from "node:path";
import type {
  BundleChapter,
  BundleExercise,
  BundleRubric,
  BundleTrack,
  Versioned,
} from "./bundle.ts";
import type { Card } from "./card.ts";
import type { LoadedChapter } from "./chapters.ts";
import type { LoadedExercise } from "./exercises.ts";
import type { LoadedRubric } from "./rubrics.ts";
import { parseJson } from "./test-cases.ts";
import { canonicalJson } from "./values.ts";
import { isRecord, type Problem, readText } from "./yaml-file.ts";

export const VERSIONS_FILE = "versions.json";

/** Each item's hashes in the order they were recorded, keyed by its type and id */
export type Versions = Record<string, string[]>;

type ItemType = "chapter" | "card" | "exercise" | "rubric";

/** An item's own content and where to report a change to it */
type Item = { type: ItemType; id: string; content: unknown; file: string };

const KEY = /^(chapter|card|exercise|rubric)\/[a-z0-9]+(-[a-z0-9]+)*$/;
const HASH = /^[0-9a-f]{64}$/;

/** A hash of an item's type and content, so equal content always hashes the same */
export function itemHash(type: ItemType, content: unknown): string {
  return createHash("sha256")
    .update(canonicalJson({ type, content }))
    .digest("hex");
}

const keyOf = (item: { type: ItemType; id: string }) =>
  `${item.type}/${item.id}`;

// A checkout on Windows can turn line endings into CRLF
const lf = (text: string) => text.replaceAll("\r\n", "\n");

function chapterContent(chapter: LoadedChapter) {
  const { track, explanation, cards, exercises, file, ...own } = chapter;
  return { ...own, explanation: lf(explanation) };
}

function exerciseContent(exercise: LoadedExercise) {
  const { dir, ...rest } = exercise;
  const statement = lf(rest.statement);
  return rest.kind === "design"
    ? { ...rest, statement, answer: lf(rest.answer) }
    : { ...rest, statement };
}

function rubricContent(rubric: LoadedRubric) {
  const { file, ...rest } = rubric;
  return rest;
}

/** Every chapter, card, exercise, and rubric in a track, with its content */
export function trackItems(
  chapters: LoadedChapter[],
  rubrics: LoadedRubric[],
): Item[] {
  const items: Item[] = [];
  for (const chapter of chapters) {
    const { file } = chapter;
    items.push({
      type: "chapter",
      id: chapter.id,
      content: chapterContent(chapter),
      file,
    });
    const cardsFile = path.join(path.dirname(file), "cards.yaml");
    for (const card of chapter.cards) {
      items.push({ type: "card", id: card.id, content: card, file: cardsFile });
    }
    for (const exercise of chapter.exercises) {
      items.push({
        type: "exercise",
        id: exercise.id,
        content: exerciseContent(exercise),
        file: path.join(exercise.dir, "exercise.yaml"),
      });
    }
  }
  for (const rubric of rubrics) {
    items.push({
      type: "rubric",
      id: rubric.id,
      content: rubricContent(rubric),
      file: rubric.file,
    });
  }
  return items;
}

/** Reads a track's `versions.json`, which is empty until the first lock */
export async function readVersions(
  file: string,
  problems: Problem[],
): Promise<Versions> {
  const text = await readText(file);
  if (text === undefined) return {};
  const data = parseJson(file, text, problems);
  if (data === undefined) return {};
  // Checked by hand, so a bad key is never printed
  const valid =
    isRecord(data) &&
    Object.entries(data).every(
      ([key, hashes]) =>
        KEY.test(key) &&
        Array.isArray(hashes) &&
        hashes.length > 0 &&
        hashes.every((hash) => typeof hash === "string" && HASH.test(hash)),
    );
  if (!valid) {
    problems.push({
      file,
      line: null,
      message: "must only map content items to lists of hashes",
    });
    return {};
  }
  return data as Versions;
}

/** Checks that every item's current hash is its latest recorded version */
export function checkVersions(
  items: Item[],
  versions: Versions,
  problems: Problem[],
) {
  for (const item of items) {
    const hashes = versions[keyOf(item)];
    const message =
      hashes === undefined
        ? "has no version yet"
        : hashes.at(-1) !== itemHash(item.type, item.content)
          ? "changed since its last version"
          : undefined;
    if (message) {
      problems.push({
        file: item.file,
        line: null,
        message: `${item.type} ${item.id} ${message}, so run pnpm content:lock`,
      });
    }
  }
}

/** Records a new version for each item whose hash changed, and leaves the rest */
export function addVersions(
  versions: Versions,
  items: Item[],
): { versions: Versions; added: number } {
  const next: Versions = { ...versions };
  let added = 0;
  for (const item of items) {
    const key = keyOf(item);
    const hash = itemHash(item.type, item.content);
    const hashes = next[key] ?? [];
    if (hashes.at(-1) !== hash) {
      next[key] = [...hashes, hash];
      added++;
    }
  }
  const sorted = Object.fromEntries(
    Object.entries(next).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  return { versions: sorted, added };
}

/**
 * A track as learners get it, with each item's hash and version number.
 * Only called once the versions are checked, so every hash is the latest.
 */
export function bundleTrack(
  track: { id: string; title: string },
  chapters: LoadedChapter[],
  rubrics: LoadedRubric[],
  versions: Versions,
): BundleTrack {
  const versioned = <T>(type: ItemType, id: string, content: T) => {
    const hash = itemHash(type, content);
    const version = versions[keyOf({ type, id })]?.length ?? 0;
    return { ...content, hash, version } as T & Versioned;
  };
  return {
    ...track,
    chapters: chapters.map(
      (chapter): BundleChapter => ({
        ...versioned("chapter", chapter.id, chapterContent(chapter)),
        cards: chapter.cards.map((card: Card) =>
          versioned("card", card.id, card),
        ),
        exercises: chapter.exercises.map(
          (exercise) =>
            versioned(
              "exercise",
              exercise.id,
              exerciseContent(exercise),
            ) as BundleExercise,
        ),
      }),
    ),
    rubrics: rubrics.map(
      (rubric): BundleRubric =>
        versioned("rubric", rubric.id, rubricContent(rubric)),
    ),
  };
}
