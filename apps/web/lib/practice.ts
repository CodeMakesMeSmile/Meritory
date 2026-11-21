import { LEVELS, REQUIRED_LEVEL } from "@meritory/content";
import { type Chapter, chapterPath, type Track } from "./content";
import { readStored, writeStored } from "./device-storage";

export type Rubric = Track["rubrics"][number];
export type Exercise = Chapter["exercises"][number];
export type DesignExercise = Extract<Exercise, { kind: "design" }>;

export { LEVELS, REQUIRED_LEVEL };

export function exercisePath(
  trackId: string,
  chapterId: string,
  exerciseId: string,
) {
  return `${chapterPath(trackId, chapterId)}/exercises/${encodeURIComponent(exerciseId)}`;
}

export function findExercise(
  track: Track,
  chapter: Chapter,
  exerciseId: string,
) {
  const exercise = chapter.exercises.find((e) => e.id === exerciseId);
  if (!exercise) return null;
  const rubric = track.rubrics.find((r) => r.id === exercise.rubric) ?? null;
  return { exercise, rubric };
}

const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 } as const;

/** Each exercise next to its sibling, easier pairs first */
export function practiceOrder(exercises: readonly Exercise[]): Exercise[] {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const sorted = [...exercises].sort(
    (a, b) =>
      DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
      a.title.localeCompare(b.title),
  );
  const placed = new Set<string>();
  const order: Exercise[] = [];
  for (const exercise of sorted) {
    if (placed.has(exercise.id)) continue;
    order.push(exercise);
    placed.add(exercise.id);
    const sibling = byId.get(exercise.sibling);
    if (sibling && !placed.has(sibling.id)) {
      order.push(sibling);
      placed.add(sibling.id);
    }
  }
  return order;
}

/** Self-scored criteria only, since tests score the rest */
export function selfCriteria(rubric: Rubric) {
  return rubric.criteria.filter((criterion) => criterion.scoredBy === "self");
}

export type Scores = Record<string, number>;

export interface Result {
  total: number;
  max: number;
  passed: boolean;
  /** Criteria under the rubric's lowest level, or required ones under 3 */
  short: { id: string; name: string; needs: number }[];
  /** True when the total alone is under the pass mark */
  totalShort: boolean;
}

/** Applies the rubric's pass rule and the exercise's required criteria */
export function scoreResult(
  rubric: Rubric,
  requires: readonly string[],
  scores: Scores,
): Result {
  const criteria = selfCriteria(rubric);
  const total = criteria.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0);
  const short = criteria.flatMap((criterion) => {
    const score = scores[criterion.id] ?? 0;
    const needs = requires.includes(criterion.id)
      ? Math.max(REQUIRED_LEVEL, rubric.pass.lowest)
      : rubric.pass.lowest;
    return score < needs
      ? [{ id: criterion.id, name: criterion.name, needs }]
      : [];
  });
  const totalShort = total < rubric.pass.total;
  return {
    total,
    max: criteria.length * LEVELS,
    passed: !totalShort && short.length === 0,
    short,
    totalShort,
  };
}

export interface Draft {
  answer: string;
  scores: Scores;
  /** Seconds on the timer when the draft was saved */
  seconds: number;
  /** Set once the learner asked for the result */
  scored: boolean;
}

export const EMPTY_DRAFT: Draft = {
  answer: "",
  scores: {},
  seconds: 0,
  scored: false,
};

function draftKey(trackId: string, exerciseId: string, version: number) {
  return `meritory.practice.${trackId}.${exerciseId}.v${version}`;
}

export const MAX_ANSWER = 20000;

/** Reads a saved draft, dropping anything that doesn't fit its shape */
export function readDraft(
  trackId: string,
  exerciseId: string,
  version: number,
): Draft {
  const raw = readStored(draftKey(trackId, exerciseId, version));
  if (!raw) return EMPTY_DRAFT;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_DRAFT;
    const value = parsed as Partial<Record<keyof Draft, unknown>>;
    const scores: Scores = {};
    if (typeof value.scores === "object" && value.scores !== null) {
      for (const [id, score] of Object.entries(value.scores)) {
        if (Number.isInteger(score) && score >= 1 && score <= LEVELS) {
          scores[id] = score;
        }
      }
    }
    return {
      answer:
        typeof value.answer === "string"
          ? value.answer.slice(0, MAX_ANSWER)
          : "",
      scores,
      seconds:
        Number.isInteger(value.seconds) && (value.seconds as number) >= 0
          ? (value.seconds as number)
          : 0,
      scored: value.scored === true,
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function writeDraft(
  trackId: string,
  exerciseId: string,
  version: number,
  draft: Draft | null,
) {
  writeStored(
    draftKey(trackId, exerciseId, version),
    draft ? JSON.stringify(draft) : null,
  );
}

/** Minutes and seconds, with hours once past an hour */
export function clock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function wordCount(text: string) {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}
