import {
  type Card,
  createEmptyCard,
  fsrs,
  type Grade,
  Rating,
  State,
} from "ts-fsrs";

/**
 * Recorded on every review so schedules can be traced back to the rules that
 * produced them. Bump it whenever the parameters below or the ts-fsrs major
 * version change.
 */
export const SCHEDULER_VERSION = "fsrs6-v1";

export type RecallRating = "again" | "hard" | "good" | "easy";

export type ReviewPhase = "new" | "learning" | "review" | "relearning";

export interface ReviewState {
  due: Date;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  phase: ReviewPhase;
  lastReview: Date | null;
}

// Fuzz is off so the phone and the server compute the same schedule
const scheduler = fsrs({ enable_fuzz: false, request_retention: 0.9 });

const ratingToGrade: Record<RecallRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const stateToPhase: Record<State, ReviewPhase> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

const phaseToState: Record<ReviewPhase, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

function fromCard(card: Card): ReviewState {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    phase: stateToPhase[card.state],
    lastReview: card.last_review ?? null,
  };
}

function toCard(state: ReviewState): Card {
  return {
    due: state.due,
    stability: state.stability,
    difficulty: state.difficulty,
    scheduled_days: state.scheduledDays,
    learning_steps: state.learningSteps,
    reps: state.reps,
    lapses: state.lapses,
    state: phaseToState[state.phase],
    ...(state.lastReview ? { last_review: state.lastReview } : {}),
  };
}

export function newReviewState(now: Date): ReviewState {
  return fromCard(createEmptyCard(now));
}

export function scheduleReview(
  state: ReviewState,
  rating: RecallRating,
  reviewedAt: Date,
): ReviewState {
  const { card } = scheduler.next(
    toCard(state),
    reviewedAt,
    ratingToGrade[rating],
  );
  return fromCard(card);
}
