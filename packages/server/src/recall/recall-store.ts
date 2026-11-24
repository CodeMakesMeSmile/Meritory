import { randomUUID } from "node:crypto";
import {
  DEFAULT_RECALL_TARGET,
  DEFAULT_TIME_ZONE,
  effectiveReviewTime,
  type LearnerSettings,
  newRecallCard,
  type RecallCard,
  type RecallRating,
  type RecallRevlog,
  reviewRecallCard,
  SCHEDULER_VERSION,
  SUGGESTED_SETTINGS,
  undoRecallReview,
} from "@meritory/learning";
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  lt,
  ne,
  notExists,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "../db/client.ts";
import {
  learnerSettings,
  recallCards,
  recallReviews,
  users,
} from "../db/schema.ts";

/** How long after a review Undo still works, past WCAG's 20-hour time limit exception */
export const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Longer answers are stored as this, so one forgotten tab can't skew the log */
export const MAX_DURATION_MS = 10 * 60 * 1000;

export interface CardKey {
  trackId: string;
  chapterId: string;
  cardId: string;
}

export interface ChapterCards {
  trackId: string;
  chapterId: string;
  cards: { id: string; version: number }[];
}

export interface StoredRecallCard extends CardKey {
  position: number;
  cardVersion: number;
  addedAt: Date;
  card: RecallCard;
  /** Whether the latest rating that still counts was Missed */
  lastMissed: boolean;
}

export interface ReviewInput extends CardKey {
  /** Made by the app, so a retry counts once */
  id: string;
  cardVersion: number;
  rating: RecallRating;
  answeredAt: Date;
  durationMs: number | null;
}

export interface SavedReview {
  id: string;
  dueAt: Date;
  undoUntil: Date;
}

export type ReviewResult =
  | { kind: "saved"; review: SavedReview }
  | { kind: "not_found" }
  | { kind: "id_reused" }
  /** A retry of a review that was undone since, so it no longer counts */
  | { kind: "undone" };

export type UndoResult =
  | { kind: "undone"; card: CardKey & { dueAt: Date } }
  | { kind: "not_found" }
  | { kind: "not_latest" }
  | { kind: "too_late" };

const GRADES: Record<RecallRating, number> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

type CardRow = typeof recallCards.$inferSelect;
type ReviewRow = typeof recallReviews.$inferSelect;

const keyOf = (key: CardKey) => `${key.trackId}/${key.chapterId}/${key.cardId}`;

function toRecallCard(row: CardRow): RecallCard {
  return {
    cardId: keyOf(row),
    stability: row.stability,
    stabilityFast: row.stabilityFast,
    difficulty: row.difficulty,
    state: row.state,
    scheduleStatus: row.scheduleStatus,
    reps: row.reps,
    lapses: row.lapses,
    scheduledDays: row.scheduledDays,
    learningStep: row.learningStep,
    dueAt: row.dueAt,
    lastReviewAt: row.lastReviewAt,
  } as RecallCard;
}

function scheduleColumns(card: RecallCard) {
  return {
    stability: card.stability,
    stabilityFast: card.stabilityFast,
    difficulty: card.difficulty,
    state: card.state,
    scheduleStatus: card.scheduleStatus,
    reps: card.reps,
    lapses: card.lapses,
    scheduledDays: card.scheduledDays,
    learningStep: card.learningStep,
    dueAt: card.dueAt,
    lastReviewAt: card.lastReviewAt,
    schedulerVersion: SCHEDULER_VERSION,
  };
}

// Stored as JSON, so its three times come back as text
function readRevlog(stored: unknown): RecallRevlog {
  const revlog = stored as Record<string, unknown>;
  return {
    ...revlog,
    dueAt: new Date(revlog.dueAt as string),
    lastReviewAt:
      revlog.lastReviewAt === null
        ? null
        : new Date(revlog.lastReviewAt as string),
    reviewTime: new Date(revlog.reviewTime as string),
  } as RecallRevlog;
}

function savedReview(row: ReviewRow): SavedReview {
  return {
    id: row.id,
    dueAt: row.dueAt as Date,
    undoUntil: new Date(row.acceptedAt.getTime() + UNDO_WINDOW_MS),
  };
}

function sameReview(row: ReviewRow, input: ReviewInput, userId: string) {
  return (
    row.userId === userId &&
    row.rating !== null &&
    row.trackId === input.trackId &&
    row.chapterId === input.chapterId &&
    row.cardId === input.cardId &&
    row.cardVersion === input.cardVersion &&
    row.rating === GRADES[input.rating] &&
    row.answeredAt?.getTime() === input.answeredAt.getTime() &&
    row.durationMs === input.durationMs
  );
}

function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown) => (value as { code?: string } | null)?.code;
  return (
    code(error) === "23505" ||
    code((error as { cause?: unknown }).cause) === "23505"
  );
}

export interface StoredSettings {
  learner: LearnerSettings;
  timeZone: string;
  interviewDate: string | null;
}

export interface SettingsChange {
  learner?: LearnerSettings;
  timeZone?: string;
  interviewDate?: string | null;
}

export interface NewSeen {
  total: number;
  byTrack: Map<string, number>;
}

type SettingsRow = typeof learnerSettings.$inferSelect;

function readSettings(row: SettingsRow | undefined): LearnerSettings {
  const s = SUGGESTED_SETTINGS;
  if (!row) return s;
  const minutes = s.rehearsalMinutes;
  return {
    newCardsPerDay: row.newCardsPerDay ?? s.newCardsPerDay,
    trackNewLimits: row.trackNewLimits ?? s.trackNewLimits,
    reviewsPerDay: row.reviewsPerDay ?? s.reviewsPerDay,
    recallTarget: row.recallTarget ?? s.recallTarget,
    interviewTarget: row.interviewTarget ?? s.interviewTarget,
    interviewWeeks: row.interviewWeeks ?? s.interviewWeeks,
    dayStartsAt: row.dayStartsAt ?? s.dayStartsAt,
    followDeviceTimeZone: row.followDeviceTimeZone ?? s.followDeviceTimeZone,
    rehearsalMinutes: {
      designReview: row.designReviewMinutes ?? minutes.designReview,
      classDesign: row.classDesignMinutes ?? minutes.classDesign,
      storyAnswer: row.storyAnswerMinutes ?? minutes.storyAnswer,
    },
    codeLanguage: (row.codeLanguage ??
      s.codeLanguage) as LearnerSettings["codeLanguage"],
  };
}

// A suggested value is stored as empty, so a later change to the suggestion reaches it
function settingsColumns(learner: LearnerSettings) {
  const s = SUGGESTED_SETTINGS;
  const own = <T>(value: T, suggested: T) =>
    value === suggested ? null : value;
  const limits = Object.keys(learner.trackNewLimits).length
    ? learner.trackNewLimits
    : null;
  return {
    newCardsPerDay: own(learner.newCardsPerDay, s.newCardsPerDay),
    trackNewLimits: limits,
    reviewsPerDay: learner.reviewsPerDay,
    recallTarget: own(learner.recallTarget, s.recallTarget),
    interviewTarget: own(learner.interviewTarget, s.interviewTarget),
    interviewWeeks: own(learner.interviewWeeks, s.interviewWeeks),
    dayStartsAt: own(learner.dayStartsAt, s.dayStartsAt),
    followDeviceTimeZone: own(
      learner.followDeviceTimeZone,
      s.followDeviceTimeZone,
    ),
    designReviewMinutes: own(
      learner.rehearsalMinutes.designReview,
      s.rehearsalMinutes.designReview,
    ),
    classDesignMinutes: own(
      learner.rehearsalMinutes.classDesign,
      s.rehearsalMinutes.classDesign,
    ),
    storyAnswerMinutes: own(
      learner.rehearsalMinutes.storyAnswer,
      s.rehearsalMinutes.storyAnswer,
    ),
    codeLanguage: own(learner.codeLanguage, s.codeLanguage),
  };
}

const cardWhere = (userId: string, key: CardKey) =>
  and(
    eq(recallCards.userId, userId),
    eq(recallCards.trackId, key.trackId),
    eq(recallCards.chapterId, key.chapterId),
    eq(recallCards.cardId, key.cardId),
  );

export function createRecallStore(db: Database["db"]) {
  async function recordOnce(
    userId: string,
    input: ReviewInput,
    now: Date,
    target: number,
  ): Promise<ReviewResult> {
    return db.transaction(async (tx) => {
      // Locks the card first, so two reviews of it take turns
      const [row] = await tx
        .select()
        .from(recallCards)
        .where(cardWhere(userId, input))
        .for("update");

      const [earlier] = await tx
        .select()
        .from(recallReviews)
        .where(eq(recallReviews.id, input.id));
      if (earlier) {
        if (!sameReview(earlier, input, userId)) return { kind: "id_reused" };
        const [undo] = await tx
          .select({ id: recallReviews.id })
          .from(recallReviews)
          .where(eq(recallReviews.undoes, input.id));
        return undo
          ? { kind: "undone" }
          : { kind: "saved", review: savedReview(earlier) };
      }
      if (!row) return { kind: "not_found" };

      const before = toRecallCard(row);
      const reviewTime = effectiveReviewTime(
        input.answeredAt,
        before.lastReviewAt ?? row.addedAt,
        now,
      );
      const { card, revlog } = reviewRecallCard(
        before,
        input.rating,
        reviewTime,
        target,
      );

      const [stored] = await tx
        .insert(recallReviews)
        .values({
          id: input.id,
          userId,
          trackId: input.trackId,
          chapterId: input.chapterId,
          cardId: input.cardId,
          cardVersion: input.cardVersion,
          rating: GRADES[input.rating],
          state: before.state,
          lastReviewAt: before.lastReviewAt,
          answeredAt: input.answeredAt,
          reviewTime,
          durationMs: input.durationMs,
          dueAt: card.dueAt,
          revlog,
          recallTarget: target,
          schedulerVersion: SCHEDULER_VERSION,
          acceptedAt: now,
        })
        .returning();
      await tx
        .update(recallCards)
        .set({
          ...scheduleColumns(card),
          cardVersion: input.cardVersion,
          lastReviewId: input.id,
        })
        .where(cardWhere(userId, input));
      return { kind: "saved", review: savedReview(stored as ReviewRow) };
    });
  }

  return {
    async timeZone(userId: string): Promise<string> {
      const [row] = await db
        .select({ timeZone: users.timeZone })
        .from(users)
        .where(eq(users.id, userId));
      return row?.timeZone ?? DEFAULT_TIME_ZONE;
    },

    /** Saves the device's time zone, unless the learner picked one of their own */
    async setDeviceTimeZone(userId: string, timeZone: string): Promise<void> {
      await db
        .update(users)
        .set({ timeZone })
        .where(
          and(
            eq(users.id, userId),
            notExists(
              db
                .select({ userId: learnerSettings.userId })
                .from(learnerSettings)
                .where(
                  and(
                    eq(learnerSettings.userId, userId),
                    eq(learnerSettings.followDeviceTimeZone, false),
                  ),
                ),
            ),
          ),
        );
    },

    /** Study settings, with suggested values filling any the learner left alone */
    async settings(userId: string): Promise<StoredSettings> {
      const [row] = await db
        .select({
          timeZone: users.timeZone,
          interviewDate: users.interviewDate,
          own: learnerSettings,
        })
        .from(users)
        .leftJoin(learnerSettings, eq(learnerSettings.userId, users.id))
        .where(eq(users.id, userId));
      return {
        learner: readSettings(row?.own ?? undefined),
        timeZone: row?.timeZone ?? DEFAULT_TIME_ZONE,
        interviewDate: row?.interviewDate ?? null,
      };
    },

    /** Saves checked settings together, so a refusal changes nothing */
    async saveSettings(userId: string, change: SettingsChange): Promise<void> {
      await db.transaction(async (tx) => {
        const profile: Partial<typeof users.$inferInsert> = {};
        if (change.timeZone !== undefined) profile.timeZone = change.timeZone;
        if (change.interviewDate !== undefined) {
          profile.interviewDate = change.interviewDate;
        }
        if (Object.keys(profile).length) {
          await tx.update(users).set(profile).where(eq(users.id, userId));
        }
        if (change.learner) {
          const columns = settingsColumns(change.learner);
          await tx
            .insert(learnerSettings)
            .values({ userId, ...columns })
            .onConflictDoUpdate({
              target: learnerSettings.userId,
              set: columns,
            });
        }
      });
    },

    /** Puts every study setting back to its suggested value */
    async resetSettings(userId: string): Promise<void> {
      await db
        .delete(learnerSettings)
        .where(eq(learnerSettings.userId, userId));
    },

    /** Adds the chapter's cards as new, and skips any already there */
    async start(
      userId: string,
      chapter: ChapterCards,
      now: Date,
    ): Promise<number> {
      if (chapter.cards.length === 0) return 0;
      const added = await db
        .insert(recallCards)
        .values(
          chapter.cards.map((card, position) => ({
            userId,
            trackId: chapter.trackId,
            chapterId: chapter.chapterId,
            cardId: card.id,
            position,
            cardVersion: card.version,
            ...scheduleColumns(
              newRecallCard(keyOf({ ...chapter, cardId: card.id }), now),
            ),
            addedAt: now,
          })),
        )
        .onConflictDoNothing()
        .returning({ cardId: recallCards.cardId });
      return added.length;
    },

    async cards(userId: string): Promise<StoredRecallCard[]> {
      // Undo moves lastReviewId back to the latest review that still counts
      const rows = await db
        .select({ row: recallCards, lastRating: recallReviews.rating })
        .from(recallCards)
        .leftJoin(recallReviews, eq(recallReviews.id, recallCards.lastReviewId))
        .where(eq(recallCards.userId, userId));
      return rows.map(({ row, lastRating }) => ({
        trackId: row.trackId,
        chapterId: row.chapterId,
        cardId: row.cardId,
        position: row.position,
        cardVersion: row.cardVersion,
        addedAt: row.addedAt,
        card: toRecallCard(row),
        lastMissed: lastRating === GRADES.again,
      }));
    },

    /** New cards reviewed since then, in all and by track, leaving out reviews that were undone */
    async newSeenSince(userId: string, since: Date): Promise<NewSeen> {
      const undo = alias(recallReviews, "undo");
      const rows = await db
        .select({ trackId: recallReviews.trackId, seen: count() })
        .from(recallReviews)
        .where(
          and(
            eq(recallReviews.userId, userId),
            eq(recallReviews.state, 0),
            isNotNull(recallReviews.rating),
            gte(recallReviews.reviewTime, since),
            notExists(
              db
                .select({ id: undo.id })
                .from(undo)
                .where(eq(undo.undoes, recallReviews.id)),
            ),
          ),
        )
        .groupBy(recallReviews.trackId);
      const byTrack = new Map(rows.map((row) => [row.trackId, row.seen]));
      const total = rows.reduce((sum, row) => sum + row.seen, 0);
      return { total, byTrack };
    },

    /**
     * Reviews since then of cards last seen before then, so new cards and
     * same-day repeats don't count toward a reviews cap
     */
    async reviewsSince(userId: string, since: Date): Promise<number> {
      const undo = alias(recallReviews, "undo");
      const [row] = await db
        .select({ seen: count() })
        .from(recallReviews)
        .where(
          and(
            eq(recallReviews.userId, userId),
            ne(recallReviews.state, 0),
            isNotNull(recallReviews.rating),
            gte(recallReviews.reviewTime, since),
            lt(recallReviews.lastReviewAt, since),
            notExists(
              db
                .select({ id: undo.id })
                .from(undo)
                .where(eq(undo.undoes, recallReviews.id)),
            ),
          ),
        );
      return row?.seen ?? 0;
    },

    async review(
      userId: string,
      input: ReviewInput,
      now: Date,
      target = DEFAULT_RECALL_TARGET,
    ): Promise<ReviewResult> {
      const capped = {
        ...input,
        durationMs:
          input.durationMs === null
            ? null
            : Math.min(input.durationMs, MAX_DURATION_MS),
      };
      try {
        return await recordOnce(userId, capped, now, target);
      } catch (error) {
        // Another request with this id got in first, so look again
        if (isUniqueViolation(error))
          return recordOnce(userId, capped, now, target);
        throw error;
      }
    },

    async undo(
      userId: string,
      reviewId: string,
      now: Date,
    ): Promise<UndoResult> {
      return db.transaction(async (tx) => {
        const [review] = await tx
          .select()
          .from(recallReviews)
          .where(
            and(
              eq(recallReviews.id, reviewId),
              eq(recallReviews.userId, userId),
              isNotNull(recallReviews.rating),
            ),
          );
        if (!review) return { kind: "not_found" };

        const [row] = await tx
          .select()
          .from(recallCards)
          .where(cardWhere(userId, review))
          .for("update");
        if (!row) return { kind: "not_found" };

        const key = {
          trackId: row.trackId,
          chapterId: row.chapterId,
          cardId: row.cardId,
        };
        const [done] = await tx
          .select({ id: recallReviews.id })
          .from(recallReviews)
          .where(eq(recallReviews.undoes, reviewId));
        // A retried undo gets the same answer
        if (done) return { kind: "undone", card: { ...key, dueAt: row.dueAt } };

        if (row.lastReviewId !== reviewId) return { kind: "not_latest" };
        if (now.getTime() - review.acceptedAt.getTime() > UNDO_WINDOW_MS) {
          return { kind: "too_late" };
        }

        const card = undoRecallReview(
          toRecallCard(row),
          readRevlog(review.revlog),
        );
        await tx.insert(recallReviews).values({
          id: randomUUID(),
          userId,
          ...key,
          cardVersion: review.cardVersion,
          schedulerVersion: SCHEDULER_VERSION,
          undoes: reviewId,
          acceptedAt: now,
        });
        const undo = alias(recallReviews, "undo");
        const [counted] = await tx
          .select({ id: recallReviews.id })
          .from(recallReviews)
          .where(
            and(
              eq(recallReviews.userId, userId),
              eq(recallReviews.trackId, key.trackId),
              eq(recallReviews.chapterId, key.chapterId),
              eq(recallReviews.cardId, key.cardId),
              isNotNull(recallReviews.rating),
              ne(recallReviews.id, reviewId),
              notExists(
                tx
                  .select({ id: undo.id })
                  .from(undo)
                  .where(eq(undo.undoes, recallReviews.id)),
              ),
            ),
          )
          .orderBy(
            desc(recallReviews.acceptedAt),
            desc(recallReviews.reviewTime),
          )
          .limit(1);
        await tx
          .update(recallCards)
          .set({ ...scheduleColumns(card), lastReviewId: counted?.id ?? null })
          .where(cardWhere(userId, key));
        return { kind: "undone", card: { ...key, dueAt: card.dueAt } };
      });
    },
  };
}

export type RecallStore = ReturnType<typeof createRecallStore>;
