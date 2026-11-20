import { randomUUID } from "node:crypto";
import { SQL_ATTACKS } from "@meritory/security-testing";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { recallCards, recallReviews, users } from "../db/schema.ts";
import {
  type ChapterCards,
  createRecallStore,
  MAX_DURATION_MS,
  type ReviewInput,
  UNDO_WINDOW_MS,
} from "./recall-store.ts";

const url = process.env.TEST_DATABASE_URL;

const MINUTE = 60 * 1000;
const start = new Date("2026-11-19T14:00:00Z");
const later = (ms: number) => new Date(start.getTime() + ms);

const CHAPTER: ChapterCards = {
  trackId: "dsa",
  chapterId: "arrays-and-hashing",
  cards: [
    { id: "card-a", version: 1 },
    { id: "card-b", version: 2 },
    { id: "card-c", version: 1 },
  ],
};

describe.skipIf(!url)("recall store against Postgres", () => {
  const database = createDatabase(url ?? "");
  const { db } = database;
  const store = createRecallStore(db);
  const made: string[] = [];

  async function user() {
    const id = randomUUID();
    await db.insert(users).values({
      id,
      name: "Recall test",
      email: `recall-${id}@meritory.test`,
    });
    made.push(id);
    return id;
  }

  const input = (over: Partial<ReviewInput> = {}): ReviewInput => ({
    id: randomUUID(),
    trackId: "dsa",
    chapterId: "arrays-and-hashing",
    cardId: "card-a",
    cardVersion: 1,
    rating: "good",
    answeredAt: start,
    durationMs: 4000,
    ...over,
  });

  const card = async (userId: string, cardId = "card-a") =>
    (await store.cards(userId)).find((stored) => stored.cardId === cardId);

  const reviewsOf = (userId: string) =>
    db.select().from(recallReviews).where(eq(recallReviews.userId, userId));

  afterAll(async () => {
    if (made.length > 0) await db.delete(users).where(inArray(users.id, made));
    await database.close();
  });

  describe("starting a chapter", () => {
    it("adds every card as new and due now", async () => {
      const me = await user();
      expect(await store.start(me, CHAPTER, start)).toBe(3);
      const cards = await store.cards(me);
      expect(cards.map((stored) => stored.cardId).sort()).toEqual([
        "card-a",
        "card-b",
        "card-c",
      ]);
      const b = cards.find((stored) => stored.cardId === "card-b");
      expect(b?.cardVersion).toBe(2);
      expect(b?.position).toBe(1);
      expect(b?.card.scheduleStatus).toBe("new");
      expect(b?.card.dueAt).toEqual(start);
    });

    it("changes nothing when started again, and adds cards written since", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      await store.review(me, input(), start);
      const reviewed = await card(me);
      expect(await store.start(me, CHAPTER, later(MINUTE))).toBe(0);
      expect(await card(me)).toEqual(reviewed);
      const grown = {
        ...CHAPTER,
        cards: [...CHAPTER.cards, { id: "card-d", version: 1 }],
      };
      expect(await store.start(me, grown, later(MINUTE))).toBe(1);
    });
  });

  describe("recording a review", () => {
    it("schedules the card and logs the review", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const review = input();
      const result = await store.review(me, review, start);
      expect(result).toEqual({
        kind: "saved",
        review: {
          id: review.id,
          dueAt: later(10 * MINUTE),
          undoUntil: later(UNDO_WINDOW_MS),
        },
      });
      const stored = await card(me);
      expect(stored?.card.reps).toBe(1);
      expect(stored?.card.dueAt).toEqual(later(10 * MINUTE));
      const [row] = await reviewsOf(me);
      expect(row).toMatchObject({
        rating: 3,
        state: 0,
        durationMs: 4000,
        schedulerVersion: "fsrs7-v2",
        recallTarget: 0.9,
      });
    });

    it("stores a retry once and answers it the same way", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const review = input();
      const first = await store.review(me, review, start);
      const again = await store.review(me, review, later(MINUTE));
      expect(again).toEqual(first);
      expect(await reviewsOf(me)).toHaveLength(1);
      expect((await card(me))?.card.reps).toBe(1);
    });

    it("refuses the same id with a different answer", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const review = input();
      await store.review(me, review, start);
      const before = await card(me);
      expect(
        await store.review(me, { ...review, rating: "easy" }, start),
      ).toEqual({ kind: "id_reused" });
      expect(await card(me)).toEqual(before);
    });

    it("refuses another user's review id without touching it", async () => {
      const me = await user();
      const other = await user();
      await store.start(me, CHAPTER, start);
      await store.start(other, CHAPTER, start);
      const review = input();
      await store.review(other, review, start);
      expect(await store.review(me, review, start)).toEqual({
        kind: "id_reused",
      });
      expect((await card(me))?.card.reps).toBe(0);
      expect(await reviewsOf(me)).toHaveLength(0);
    });

    it("answers as if another user's card doesn't exist", async () => {
      const me = await user();
      const other = await user();
      await store.start(other, CHAPTER, start);
      expect(await store.review(me, input(), start)).toEqual({
        kind: "not_found",
      });
      expect((await card(other))?.card.reps).toBe(0);
    });

    it("applies two reviews of one card one after the other", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const results = await Promise.all([
        store.review(me, input(), start),
        store.review(me, input(), start),
      ]);
      expect(results.every((result) => result.kind === "saved")).toBe(true);
      expect((await card(me))?.card.reps).toBe(2);
      const states = (await reviewsOf(me)).map((row) => row.state).sort();
      expect(states).toEqual([0, 1]);
    });

    it("stores a retry sent at the same moment once", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const review = input();
      const [a, b] = await Promise.all([
        store.review(me, review, start),
        store.review(me, review, start),
      ]);
      expect(a).toEqual(b);
      expect(await reviewsOf(me)).toHaveLength(1);
    });

    it("keeps a card's schedule when its content version changes", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      await store.review(me, input(), start);
      const before = await card(me);
      await store.review(
        me,
        input({ cardVersion: 2, answeredAt: later(10 * MINUTE) }),
        later(10 * MINUTE),
      );
      const after = await card(me);
      expect(after?.cardVersion).toBe(2);
      expect(after?.card.reps).toBe(2);
      expect(after?.card.stability).not.toBe(before?.card.stability);
    });

    it("caps a long answer time", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      await store.review(me, input({ durationMs: 3 * 60 * 60 * 1000 }), start);
      const [row] = await reviewsOf(me);
      expect(row?.durationMs).toBe(MAX_DURATION_MS);
    });

    it("doesn't trust a clock ahead of the server", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      await store.review(me, input({ answeredAt: later(60 * MINUTE) }), start);
      const [row] = await reviewsOf(me);
      expect(row?.reviewTime).toEqual(start);
    });
  });

  describe("undo", () => {
    it("puts the card back exactly and keeps both rows", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const before = await card(me);
      const review = input();
      await store.review(me, review, start);
      const result = await store.undo(me, review.id, later(MINUTE));
      expect(result).toEqual({
        kind: "undone",
        card: {
          trackId: "dsa",
          chapterId: "arrays-and-hashing",
          cardId: "card-a",
          dueAt: start,
        },
      });
      expect((await card(me))?.card).toEqual(before?.card);
      const rows = await reviewsOf(me);
      expect(rows).toHaveLength(2);
      expect(rows.find((row) => row.undoes === review.id)?.rating).toBeNull();
    });

    it("answers a retried undo the same way and undoes once", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const review = input();
      await store.review(me, review, start);
      const first = await store.undo(me, review.id, later(MINUTE));
      expect(await store.undo(me, review.id, later(MINUTE))).toEqual(first);
      expect(await reviewsOf(me)).toHaveLength(2);
    });

    it("only undoes the card's latest review", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const older = input();
      await store.review(me, older, start);
      await store.review(
        me,
        input({ answeredAt: later(MINUTE) }),
        later(MINUTE),
      );
      expect(await store.undo(me, older.id, later(MINUTE))).toEqual({
        kind: "not_latest",
      });
    });

    it("stops after ten minutes", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const review = input();
      await store.review(me, review, start);
      expect(
        await store.undo(me, review.id, later(UNDO_WINDOW_MS + 1)),
      ).toEqual({ kind: "too_late" });
    });

    it("answers as if another user's review doesn't exist", async () => {
      const me = await user();
      const other = await user();
      await store.start(other, CHAPTER, start);
      const review = input();
      await store.review(other, review, start);
      expect(await store.undo(me, review.id, start)).toEqual({
        kind: "not_found",
      });
      expect((await card(other))?.card.reps).toBe(1);
    });
  });

  describe("new cards seen today", () => {
    it("counts first reviews since the day began, minus undone ones", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      const a = input();
      await store.review(me, a, start);
      await store.review(me, input({ cardId: "card-b" }), start);
      // A second look at a learning card isn't a new card
      await store.review(
        me,
        input({ answeredAt: later(10 * MINUTE) }),
        later(10 * MINUTE),
      );
      expect(await store.newSeenSince(me, start)).toBe(2);
      expect(await store.newSeenSince(me, later(MINUTE))).toBe(0);

      const c = input({ cardId: "card-c" });
      await store.review(me, c, start);
      await store.undo(me, c.id, start);
      expect(await store.newSeenSince(me, start)).toBe(2);
    });
  });

  describe("last missed", () => {
    it("follows the latest rating that still counts", async () => {
      const me = await user();
      await store.start(me, CHAPTER, start);
      expect((await card(me))?.lastMissed).toBe(false);

      await store.review(me, input({ rating: "again" }), start);
      expect((await card(me))?.lastMissed).toBe(true);
      expect((await card(me, "card-b"))?.lastMissed).toBe(false);

      await store.review(
        me,
        input({ rating: "good", answeredAt: later(MINUTE) }),
        later(MINUTE),
      );
      expect((await card(me))?.lastMissed).toBe(false);

      const miss = input({ cardId: "card-c", rating: "again" });
      await store.review(me, miss, start);
      await store.undo(me, miss.id, start);
      expect((await card(me, "card-c"))?.lastMissed).toBe(false);
    });
  });

  describe("time zone", () => {
    it("falls back to UTC and keeps what's set", async () => {
      const me = await user();
      expect(await store.timeZone(me)).toBe("UTC");
      await store.setTimeZone(me, "America/Toronto");
      expect(await store.timeZone(me)).toBe("America/Toronto");
    });
  });

  it("stores attack strings exactly and matches nothing else", async () => {
    const me = await user();
    const other = await user();
    await store.start(other, CHAPTER, start);
    for (const attack of SQL_ATTACKS) {
      const chapter = {
        trackId: attack,
        chapterId: attack,
        cards: [{ id: attack, version: 1 }],
      };
      expect(await store.start(me, chapter, start)).toBe(1);
      const review = input({
        trackId: attack,
        chapterId: attack,
        cardId: attack,
      });
      expect((await store.review(me, review, start)).kind).toBe("saved");
      expect((await store.undo(me, review.id, start)).kind).toBe("undone");
      await store.setTimeZone(me, attack);
      expect(await store.timeZone(me)).toBe(attack);
    }
    const mine = await db
      .select({ cardId: recallCards.cardId })
      .from(recallCards)
      .where(eq(recallCards.userId, me));
    expect(mine.map((row) => row.cardId).sort()).toEqual(
      [...SQL_ATTACKS].sort(),
    );
    expect((await store.cards(other)).every((c) => c.card.reps === 0)).toBe(
      true,
    );
    expect(await store.timeZone(other)).toBe("UTC");
  });

  it("goes with the account when it's deleted", async () => {
    const me = await user();
    await store.start(me, CHAPTER, start);
    const review = input();
    await store.review(me, review, start);
    await store.undo(me, review.id, start);
    await db.delete(users).where(eq(users.id, me));
    const left = await db
      .select()
      .from(recallReviews)
      .where(and(eq(recallReviews.userId, me)));
    expect(left).toHaveLength(0);
    expect(await store.cards(me)).toEqual([]);
  });
});
