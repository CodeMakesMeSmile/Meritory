import type { Card } from "./card.ts";
import type { ChapterFile, TrackFile } from "./chapter.ts";
import type { ExerciseFile, Signature } from "./exercise.ts";
import type { RubricFile } from "./rubric.ts";
import type { TestCase } from "./test-cases.ts";

/** A hash of an item's own content, and how many versions it has had */
export type Versioned = { hash: string; version: number };

type ExerciseBase = Omit<ExerciseFile, "kind" | "signature"> & {
  statement: string;
};

export type BundleCodingExercise = ExerciseBase & {
  kind: "coding";
  signature: Signature;
  cases: TestCase[];
};

export type BundleDesignExercise = ExerciseBase & {
  kind: "design";
  answer: string;
};

/** An exercise as learners get it, without its reference solutions */
export type BundleExercise = (BundleCodingExercise | BundleDesignExercise) &
  Versioned;

export type BundleChapter = ChapterFile & {
  explanation: string;
  cards: (Card & Versioned)[];
  exercises: BundleExercise[];
} & Versioned;

export type BundleRubric = RubricFile & Versioned;

export type BundleTrack = TrackFile & {
  chapters: BundleChapter[];
  rubrics: BundleRubric[];
};

/** Every track's content, with one hash over all of it for caching */
export type Bundle = { hash: string; tracks: BundleTrack[] };
