import { DefaultScheduler, type Grade, Rating, State } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import {
  isLearned,
  newRecallCard,
  nextDueDates,
  type RecallRating,
  reviewRecallCard,
  undoRecallReview,
} from "./scheduler.ts";

const start = new Date("2026-11-01T09:00:00Z");

const ratings: [RecallRating, Grade][] = [
  ["again", Rating.Again],
  ["hard", Rating.Hard],
  ["good", Rating.Good],
  ["easy", Rating.Easy],
];

function preset(target: number) {
  return DefaultScheduler({
    version: "FSRS-7",
    desiredRetention: target,
    enableFuzz: false,
    learningSteps: ["1m", "10m"],
    relearningSteps: ["10m"],
    allowModelOverride: false,
    maximumInterval: 36500,
  });
}

describe("reviewRecallCard", () => {
  it("starts a new card due immediately", () => {
    const card = newRecallCard("card-1", start);
    expect(card.scheduleStatus).toBe("new");
    expect(card.dueAt).toEqual(start);
    expect(card.reps).toBe(0);
  });

  for (const target of [0.9, 0.95]) {
    it(`matches the FSRS-7 preset for every rating at ${target}`, async () => {
      const expected = await preset(target);
      for (const [rating, grade] of ratings) {
        let ours = newRecallCard("card-1", start);
        let theirs = expected.newCard({ cardId: "card-1", now: start });
        let now = start;
        // A first rating, then three good reviews, each on its due date
        for (const step of [rating, "good", "good", "good"] as const) {
          ours = reviewRecallCard(ours, step, now, target).card;
          theirs = expected.review({
            card: theirs,
            grade: step === rating ? grade : Rating.Good,
            now,
          }).card;
          expect(ours.dueAt).toEqual(theirs.dueAt);
          now = ours.dueAt;
        }
      }
    });
  }

  it("brings a card back sooner at a higher recall target", () => {
    const learned = reviewRecallCard(
      newRecallCard("card-1", start),
      "easy",
      start,
    ).card;
    const usual = reviewRecallCard(learned, "good", learned.dueAt, 0.9).card;
    const higher = reviewRecallCard(learned, "good", learned.dueAt, 0.95).card;
    expect(higher.dueAt.getTime()).toBeLessThan(usual.dueAt.getTime());
  });

  it("keeps the three times a review needs to be undone", () => {
    const first = reviewRecallCard(
      newRecallCard("card-1", start),
      "easy",
      start,
    ).card;
    const late = new Date(first.dueAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    const { card, revlog } = reviewRecallCard(first, "good", late);
    expect(revlog.lastReviewAt).toEqual(start);
    expect(revlog.dueAt).toEqual(first.dueAt);
    expect(revlog.reviewTime).toEqual(late);
    expect(revlog.rating).toBe(Rating.Good);
    expect(card.lastReviewAt).toEqual(late);
  });

  it("counts a lapse when a learned card is forgotten", () => {
    const learned = reviewRecallCard(
      newRecallCard("card-1", start),
      "easy",
      start,
    ).card;
    expect(learned.state).toBe(State.Review);
    const forgotten = reviewRecallCard(learned, "again", learned.dueAt).card;
    expect(forgotten.state).toBe(State.Relearning);
    expect(forgotten.lapses).toBe(1);
  });

  it("gives the same result every time for the same input", () => {
    const card = newRecallCard("card-1", start);
    expect(reviewRecallCard(card, "good", start)).toEqual(
      reviewRecallCard(card, "good", start),
    );
  });

  for (const target of [0, 1, -0.5, 1.5, Number.NaN]) {
    it(`refuses a recall target of ${target}`, () => {
      const card = newRecallCard("card-1", start);
      expect(() => reviewRecallCard(card, "good", start, target)).toThrow(
        RangeError,
      );
    });
  }
});

describe("nextDueDates", () => {
  it("gives the due date each rating would set", () => {
    const card = newRecallCard("card-1", start);
    const dates = nextDueDates(card, start);
    for (const [rating] of ratings) {
      expect(dates[rating]).toEqual(
        reviewRecallCard(card, rating, start).card.dueAt,
      );
    }
    expect(dates.again.getTime()).toBeLessThan(dates.easy.getTime());
  });
});

describe("learning steps", () => {
  const minutes = (date: Date) => (date.getTime() - start.getTime()) / 60_000;

  it("brings a new card back within the session unless it's easy", () => {
    const dates = nextDueDates(newRecallCard("card-1", start), start);
    expect(minutes(dates.again)).toBe(1);
    expect(Math.round(minutes(dates.hard))).toBe(6);
    expect(minutes(dates.good)).toBe(10);
    expect(Math.round(minutes(dates.easy) / (24 * 60))).toBe(54);
  });
});

describe("undoRecallReview", () => {
  it("puts the card back exactly as it was", () => {
    let card = newRecallCard("card-1", start);
    let now = start;
    for (const rating of ["good", "good", "again", "hard", "easy"] as const) {
      const { card: next, revlog } = reviewRecallCard(card, rating, now);
      expect(undoRecallReview(next, revlog)).toEqual(card);
      card = next;
      now = card.dueAt;
    }
  });
});

describe("isLearned", () => {
  it("counts a card from leaving the learning steps until it lapses", () => {
    let card = newRecallCard("dsa/arrays-and-hashing/c1", start);
    expect(isLearned(card)).toBe(false);
    card = reviewRecallCard(card, "good", start).card;
    expect(isLearned(card)).toBe(false);
    card = reviewRecallCard(card, "good", card.dueAt).card;
    expect(isLearned(card)).toBe(true);
    card = reviewRecallCard(card, "again", card.dueAt).card;
    expect(isLearned(card)).toBe(false);
  });
});
