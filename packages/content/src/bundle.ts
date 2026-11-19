import Type, { type Static, type TProperties } from "typebox";
import { MatchingCard, OrderingCard, PickOneCard, PromptCard } from "./card.ts";
import { ChapterFile, TrackFile } from "./chapter.ts";
import {
  ClassSignature,
  ExerciseFile,
  FunctionSignature,
  TestCase,
} from "./exercise.ts";
import { TEXT_PATTERN } from "./fact.ts";
import { RubricFile } from "./rubric.ts";

const Hash = Type.String({ pattern: "^[0-9a-f]{64}$" });

const versionedFields = {
  hash: Hash,
  /** How many versions the item has had, starting at 1 */
  version: Type.Integer({ minimum: 1 }),
};

/** A hash of an item's own content, and how many versions it has had */
export type Versioned = { hash: string; version: number };

const strict = <T extends TProperties>(properties: T) =>
  Type.Object(properties, { additionalProperties: false });

const Markdown = Type.String({ minLength: 1, pattern: TEXT_PATTERN });

const {
  kind: _kind,
  signature: _signature,
  ...exerciseFields
} = ExerciseFile.properties;

export const BundleCodingExercise = strict({
  ...exerciseFields,
  statement: Markdown,
  kind: Type.Literal("coding"),
  signature: Type.Union([FunctionSignature, ClassSignature]),
  cases: Type.Array(TestCase),
  ...versionedFields,
});
export type BundleCodingExercise = Static<typeof BundleCodingExercise>;

export const BundleDesignExercise = strict({
  ...exerciseFields,
  statement: Markdown,
  kind: Type.Literal("design"),
  answer: Markdown,
  ...versionedFields,
});
export type BundleDesignExercise = Static<typeof BundleDesignExercise>;

/** An exercise as learners get it, without its reference solutions */
export const BundleExercise = Type.Union([
  BundleCodingExercise,
  BundleDesignExercise,
]);
export type BundleExercise = Static<typeof BundleExercise>;

export const BundleCard = Type.Union([
  strict({ ...PromptCard.properties, ...versionedFields }),
  strict({ ...OrderingCard.properties, ...versionedFields }),
  strict({ ...MatchingCard.properties, ...versionedFields }),
  strict({ ...PickOneCard.properties, ...versionedFields }),
]);
export type BundleCard = Static<typeof BundleCard>;

export const BundleChapter = strict({
  ...ChapterFile.properties,
  explanation: Markdown,
  cards: Type.Array(BundleCard),
  exercises: Type.Array(BundleExercise),
  ...versionedFields,
});
export type BundleChapter = Static<typeof BundleChapter>;

export const BundleRubric = strict({
  ...RubricFile.properties,
  ...versionedFields,
});
export type BundleRubric = Static<typeof BundleRubric>;

export const BundleTrack = strict({
  ...TrackFile.properties,
  chapters: Type.Array(BundleChapter),
  rubrics: Type.Array(BundleRubric),
});
export type BundleTrack = Static<typeof BundleTrack>;

/** Every track's content, with one hash over all of it for caching */
export const Bundle = strict({
  hash: Hash,
  tracks: Type.Array(BundleTrack),
});
export type Bundle = Static<typeof Bundle>;
