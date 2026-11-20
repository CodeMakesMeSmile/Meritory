import { randomUUID } from "node:crypto";
import {
  DEFAULT_RECALL_TARGET,
  DEFAULT_TIME_ZONE,
  effectiveReviewTime,
  newRecallCard,
  type RecallCard,
  type RecallRating,
  type RecallRevlog,
  reviewRecallCard,
  SCHEDULER_VERSION,
  undoRecallReview,
} from "@meritory/learning";
import { and, count, eq, gte, isNotNull, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "../db/client.ts";
import { recallCards, recallReviews, users } from "../db/schema.ts";

/** How long after a review Undo still works */
export const UNDO_WINDOW_MS = 10 * 60 * 1000;

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
  | { kind: "id_reused" };

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
        return sameReview(earlier, input, userId)
          ? { kind: "saved", review: savedReview(earlier) }
          : { kind: "id_reused" };
      }
      if (!row) return { kind: "not_found" };

      const before = toRecallCard(row);
      const reviewTime = effectiveReviewTime(
        input.answeredAt,
        before.lastReviewAt,
        now,
      );
      const { card, revlog } = reviewRecallCard(
        before,
        input.rating,
        reviewTime,
        DEFAULT_RECALL_TARGET,
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
          answeredAt: input.answeredAt,
          reviewTime,
          durationMs: input.durationMs,
          dueAt: card.dueAt,
          revlog,
          recallTarget: DEFAULT_RECALL_TARGET,
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

    async setTimeZone(userId: string, timeZone: string): Promise<void> {
      await db.update(users).set({ timeZone }).where(eq(users.id, userId));
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
      // Undo clears lastReviewId, so an undone miss doesn't count
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

    /** New cards reviewed since then, leaving out reviews that were undone */
    async newSeenSince(userId: string, since: Date): Promise<number> {
      const undo = alias(recallReviews, "undo");
      const [row] = await db
        .select({ seen: count() })
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
        );
      return row?.seen ?? 0;
    },

    async review(
      userId: string,
      input: ReviewInput,
      now: Date,
    ): Promise<ReviewResult> {
      const capped = {
        ...input,
        durationMs:
          input.durationMs === null
            ? null
            : Math.min(input.durationMs, MAX_DURATION_MS),
      };
      try {
        return await recordOnce(userId, capped, now);
      } catch (error) {
        // Another request with this id got in first, so look again
        if (isUniqueViolation(error)) return recordOnce(userId, capped, now);
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
        await tx
          .update(recallCards)
          .set({ ...scheduleColumns(card), lastReviewId: null })
          .where(cardWhere(userId, key));
        return { kind: "undone", card: { ...key, dueAt: card.dueAt } };
      });
    },
  };
}

export type RecallStore = ReturnType<typeof createRecallStore>;
