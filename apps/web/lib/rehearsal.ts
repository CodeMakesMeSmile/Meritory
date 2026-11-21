import { readStored, writeStored } from "./device-storage";
import {
  cleanScores,
  MAX_ANSWER,
  REQUIRED_LEVEL,
  type Result,
  type Rubric,
  type Scores,
  selfCriteria,
} from "./practice";

/**
 * Minutes on the clock, set by the rubric an exercise is scored with. A
 * design review is a full interview round, and a story is one answer in a
 * behavioral round. Other rubrics have no rehearsal until they get a length.
 */
const MINUTES_BY_RUBRIC: ReadonlyMap<string, number> = new Map([
  ["design-review", 45],
  ["story-review", 5],
]);

export function rehearsalMinutes(rubricId: string): number | null {
  return MINUTES_BY_RUBRIC.get(rubricId) ?? null;
}

export type Debrief = "unknown" | "froze";

export interface Run {
  /** Milliseconds since the epoch, like Date.now() */
  startedAt: number;
  endsAt: number;
  answer: string;
  /** When the answer locked, at the deadline or when finished early */
  lockedAt: number | null;
  scores: Scores;
  /** Set once the learner asked for the result */
  scored: boolean;
  debrief: Record<string, Debrief>;
}

export interface PastRun {
  startedAt: number;
  total: number;
  max: number;
  passed: boolean;
  debrief: Record<string, Debrief>;
}

export interface Rehearsals {
  current: Run | null;
  /** Newest first */
  past: PastRun[];
}

export const NO_REHEARSALS: Rehearsals = { current: null, past: [] };

export const MAX_PAST = 20;

export function startRun(minutes: number, now: number): Run {
  return {
    startedAt: now,
    endsAt: now + minutes * 60_000,
    answer: "",
    lockedAt: null,
    scores: {},
    scored: false,
    debrief: {},
  };
}

export function isLocked(run: Run, now: number) {
  return run.lockedAt !== null || now >= run.endsAt;
}

/** Whole seconds left, rounded up so the clock shows 0:00 only at the end */
export function secondsLeft(run: Run, now: number) {
  const at = run.lockedAt ?? now;
  return Math.max(0, Math.ceil((run.endsAt - at) / 1000));
}

/** Seconds from the start to the lock, or to now while it runs */
export function secondsUsed(run: Run, now: number) {
  const at = Math.min(run.lockedAt ?? now, run.endsAt);
  return Math.max(0, Math.round((at - run.startedAt) / 1000));
}

export function timedOut(run: Run) {
  return run.lockedAt !== null && run.lockedAt >= run.endsAt;
}

/** Locks the answer now, or at the deadline if that has passed */
export function lockRun(run: Run, now: number): Run {
  if (run.lockedAt !== null) return run;
  return { ...run, lockedAt: Math.min(now, run.endsAt) };
}

/** A locked answer stays as it was */
export function editAnswer(run: Run, answer: string, now: number): Run {
  if (isLocked(run, now)) return run;
  return { ...run, answer: answer.slice(0, MAX_ANSWER) };
}

/** Keeps the result with the past rehearsals, newest first */
export function recordResult(state: Rehearsals, result: Result): Rehearsals {
  const run = state.current;
  if (!run || run.scored || run.lockedAt === null) return state;
  const entry: PastRun = {
    startedAt: run.startedAt,
    total: result.total,
    max: result.max,
    passed: result.passed,
    debrief: run.debrief,
  };
  return {
    current: { ...run, scored: true },
    past: [
      entry,
      ...state.past.filter((p) => p.startedAt !== run.startedAt),
    ].slice(0, MAX_PAST),
  };
}

/** Saves a debrief answer on the current run and its past entry */
export function setDebrief(
  state: Rehearsals,
  criterionId: string,
  answer: Debrief,
): Rehearsals {
  const run = state.current;
  if (!run) return state;
  const debrief = { ...run.debrief, [criterionId]: answer };
  return {
    current: { ...run, debrief },
    past: state.past.map((p) =>
      p.startedAt === run.startedAt ? { ...p, debrief } : p,
    ),
  };
}

export type Stage = "start" | "running" | "locked" | "done";

export function stageOf(state: Rehearsals, now: number): Stage {
  const run = state.current;
  if (!run) return "start";
  if (!isLocked(run, now)) return "running";
  return run.scored ? "done" : "locked";
}

/** The solid level, or the rubric's lowest pass level if that's higher */
export function debriefBar(rubric: Rubric) {
  return Math.max(REQUIRED_LEVEL, rubric.pass.lowest);
}

/** Criteria scored under the bar, the ones the debrief asks about */
export function debriefCriteria(rubric: Rubric, scores: Scores) {
  const bar = debriefBar(rubric);
  return selfCriteria(rubric).flatMap((criterion) => {
    const level = scores[criterion.id] ?? 0;
    return level < bar
      ? [{ id: criterion.id, name: criterion.name, level }]
      : [];
  });
}

const MARKS = [30, 15, 10, 5, 1];

/**
 * The minute mark the clock just passed, so it's announced a few times
 * instead of every second. Marks at or over the full length are skipped.
 */
export function timeMark(before: number, after: number, total: number) {
  const passed = MARKS.filter((m) => m * 60 < total)
    .filter((m) => after <= m * 60 && m * 60 < before)
    .sort((a, b) => a - b);
  return passed[0] ?? null;
}

export function minutesText(minutes: number) {
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

function rehearsalKey(trackId: string, exerciseId: string, version: number) {
  return `meritory.rehearsal.${trackId}.${exerciseId}.v${version}`;
}

function isTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function cleanDebrief(value: unknown): Record<string, Debrief> {
  const debrief: Record<string, Debrief> = {};
  if (typeof value === "object" && value !== null) {
    for (const [id, answer] of Object.entries(value)) {
      if (answer === "unknown" || answer === "froze") debrief[id] = answer;
    }
  }
  return debrief;
}

const LONGEST = 3 * 60 * 60_000;

function cleanRun(value: unknown): Run | null {
  if (typeof value !== "object" || value === null) return null;
  const run = value as Partial<Record<keyof Run, unknown>>;
  const { startedAt, endsAt, lockedAt } = run;
  if (!isTime(startedAt) || !isTime(endsAt)) return null;
  if (endsAt <= startedAt || endsAt - startedAt > LONGEST) return null;
  const locked =
    isTime(lockedAt) && lockedAt >= startedAt && lockedAt <= endsAt
      ? lockedAt
      : null;
  return {
    startedAt,
    endsAt,
    answer:
      typeof run.answer === "string" ? run.answer.slice(0, MAX_ANSWER) : "",
    lockedAt: locked,
    scores: cleanScores(run.scores),
    scored: run.scored === true && locked !== null,
    debrief: cleanDebrief(run.debrief),
  };
}

function cleanPast(value: unknown): PastRun | null {
  if (typeof value !== "object" || value === null) return null;
  const past = value as Partial<Record<keyof PastRun, unknown>>;
  const { startedAt, total, max } = past;
  if (!isTime(startedAt) || !Number.isInteger(total) || !Number.isInteger(max))
    return null;
  if ((total as number) < 0 || (max as number) < (total as number)) return null;
  return {
    startedAt,
    total: total as number,
    max: max as number,
    passed: past.passed === true,
    debrief: cleanDebrief(past.debrief),
  };
}

/** Reads this exercise's rehearsals, dropping anything that doesn't fit */
export function readRehearsals(
  trackId: string,
  exerciseId: string,
  version: number,
): Rehearsals {
  const raw = readStored(rehearsalKey(trackId, exerciseId, version));
  if (!raw) return NO_REHEARSALS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return NO_REHEARSALS;
    const value = parsed as Partial<Record<keyof Rehearsals, unknown>>;
    const past = Array.isArray(value.past)
      ? value.past
          .map(cleanPast)
          .filter((p): p is PastRun => p !== null)
          .sort((a, b) => b.startedAt - a.startedAt)
          .slice(0, MAX_PAST)
      : [];
    return { current: cleanRun(value.current), past };
  } catch {
    return NO_REHEARSALS;
  }
}

export function writeRehearsals(
  trackId: string,
  exerciseId: string,
  version: number,
  rehearsals: Rehearsals,
) {
  const empty = rehearsals.current === null && rehearsals.past.length === 0;
  writeStored(
    rehearsalKey(trackId, exerciseId, version),
    empty ? null : JSON.stringify(rehearsals),
  );
}
