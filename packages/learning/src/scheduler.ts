import { dateChrono, defineScheduler, type Grade, Rating } from "ts-fsrs";
import {
  schedulerDesiredRetentionMiddleware,
  schedulerFuzzingMiddleware,
  schedulerLearningStepsMiddleware,
  schedulerMaximumIntervalMiddleware,
  schedulerMonotonicIntervalMiddleware,
  schedulerScheduledDaysMiddleware,
  schedulerStatsMiddleware,
} from "ts-fsrs/middlewares";
import { FSRS7_DEFAULT_WEIGHTS, FSRS7Model } from "ts-fsrs/models/fsrs-7";

/**
 * Recorded on every review so schedules can be traced back to the rules that
 * produced them. Bump it whenever the settings below or the model change.
 */
export const SCHEDULER_VERSION = "fsrs7-v2";

/** The chance of recalling a card when it comes due */
export const DEFAULT_RECALL_TARGET = 0.9;

export type RecallRating = "again" | "hard" | "good" | "easy";

const ratingToGrade: Record<RecallRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const gradeToRating = new Map<Grade, RecallRating>(
  Object.entries(ratingToGrade).map(([rating, grade]) => [
    grade,
    rating as RecallRating,
  ]),
);

// The same policies, in the same order, as the library's default preset
const definition = defineScheduler({
  model: FSRS7Model,
  chrono: dateChrono,
}).use(
  schedulerDesiredRetentionMiddleware,
  schedulerFuzzingMiddleware,
  schedulerStatsMiddleware,
  schedulerScheduledDaysMiddleware,
  schedulerLearningStepsMiddleware,
  schedulerMaximumIntervalMiddleware,
  schedulerMonotonicIntervalMiddleware,
);

function createScheduler(target: number) {
  return definition.create({
    config: {
      weights: FSRS7_DEFAULT_WEIGHTS,
      fractionalDays: true,
      desiredRetention: target,
      // Fuzz is off so the phone and the server compute the same schedule
      enableFuzz: false,
      enableShortTerm: true,
      learningSteps: ["1m", "10m"],
      relearningSteps: ["10m"],
      graduatingInterval: 1,
      // Keeps new cards on the 1m and 10m steps instead of jumping to days
      allowModelOverride: false,
      maximumInterval: 36500,
      clearStatsOnForget: false,
    },
  });
}

type Scheduler = ReturnType<typeof createScheduler>;

export type RecallCard = ReturnType<Scheduler["newCard"]>;

/** What a card looked like before a review, kept so the review can be undone */
export type RecallRevlog = ReturnType<Scheduler["review"]>["revlog"];

export interface RecallReview {
  card: RecallCard;
  revlog: RecallRevlog;
}

const schedulers = new Map<number, Scheduler>();

function schedulerFor(target: number): Scheduler {
  if (!(target > 0 && target < 1)) {
    throw new RangeError(
      `Recall target must be between 0 and 1, not ${target}`,
    );
  }
  let scheduler = schedulers.get(target);
  if (!scheduler) {
    scheduler = createScheduler(target);
    schedulers.set(target, scheduler);
  }
  return scheduler;
}

export function newRecallCard(cardId: string, now: Date): RecallCard {
  return schedulerFor(DEFAULT_RECALL_TARGET).newCard({ cardId, now });
}

export function reviewRecallCard(
  card: RecallCard,
  rating: RecallRating,
  reviewTime: Date,
  target = DEFAULT_RECALL_TARGET,
): RecallReview {
  return schedulerFor(target).review({
    card,
    grade: ratingToGrade[rating],
    now: reviewTime,
  });
}

/** When the card would next be due for each rating, shown on the buttons */
export function nextDueDates(
  card: RecallCard,
  now: Date,
  target = DEFAULT_RECALL_TARGET,
): Record<RecallRating, Date> {
  const dates: Partial<Record<RecallRating, Date>> = {};
  for (const item of schedulerFor(target).preview({ card, now })) {
    const rating = gradeToRating.get(item.grade);
    if (rating) dates[rating] = item.card.dueAt;
  }
  return dates as Record<RecallRating, Date>;
}

/** The card exactly as it was before the review that produced this revlog */
export function undoRecallReview(
  card: RecallCard,
  revlog: RecallRevlog,
): RecallCard {
  return schedulerFor(DEFAULT_RECALL_TARGET).rollback({ card, revlog });
}
