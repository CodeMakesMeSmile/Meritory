import { describe, expect, it } from "vitest";
import { buildRecallQueue, trackNewLeft } from "./queue.ts";
import { newRecallCard, reviewRecallCard } from "./scheduler.ts";

const now = new Date("2026-11-18T09:00:00Z");
const day = 24 * 60 * 60 * 1000;
const start = new Date("2026-01-01T09:00:00Z");

function fresh(count: number, trackId = "dsa") {
  return Array.from({ length: count }, (_, i) => ({
    ...newRecallCard(`${trackId}-new-${i}`, now),
    trackId,
  }));
}

function dueAt(id: string, daysAgo: number) {
  const reviewed = reviewRecallCard(
    newRecallCard(id, start),
    "easy",
    start,
  ).card;
  return {
    ...reviewed,
    trackId: "dsa",
    dueAt: new Date(now.getTime() - daysAgo * day),
  };
}

const ids = (cards: { cardId: unknown }[]) => cards.map((card) => card.cardId);

describe("buildRecallQueue", () => {
  it("puts due cards first, then ten new cards", () => {
    const due = [dueAt("due-0", 1), dueAt("due-1", 3), dueAt("due-2", 2)];
    const queue = buildRecallQueue([...fresh(15), ...due], now, {
      newLeft: 10,
    });
    expect(ids(queue)).toEqual(["due-1", "due-2", "due-0", ...ids(fresh(10))]);
  });

  it("leaves out cards that aren't due yet", () => {
    const later = dueAt("later", -1);
    expect(buildRecallQueue([later], now, { newLeft: 10 })).toEqual([]);
  });

  it("serves only what is left of the new card allowance", () => {
    expect(buildRecallQueue(fresh(15), now, { newLeft: 3 })).toHaveLength(3);
    expect(buildRecallQueue(fresh(15), now, { newLeft: 0 })).toEqual([]);
    expect(buildRecallQueue(fresh(15), now, { newLeft: -2 })).toEqual([]);
  });

  it("still shows due cards once the new cards run out", () => {
    const due = dueAt("due-0", 1);
    expect(buildRecallQueue([...fresh(3), due], now, { newLeft: 0 })).toEqual([
      due,
    ]);
  });

  it("skips a track that used up its own limit and fills from the next", () => {
    const queue = buildRecallQueue(
      [...fresh(4, "dsa"), ...fresh(4, "design")],
      now,
      { newLeft: 5, trackNewLeft: new Map([["dsa", 2]]) },
    );
    expect(ids(queue)).toEqual([
      "dsa-new-0",
      "dsa-new-1",
      "design-new-0",
      "design-new-1",
      "design-new-2",
    ]);
  });

  it("pauses a track with a limit of 0", () => {
    const queue = buildRecallQueue(
      [...fresh(2, "dsa"), ...fresh(2, "design")],
      now,
      { newLeft: 10, trackNewLeft: new Map([["dsa", 0]]) },
    );
    expect(ids(queue)).toEqual(["design-new-0", "design-new-1"]);
  });

  it("serves only what is left of the reviews cap, oldest first", () => {
    const due = [dueAt("due-0", 1), dueAt("due-1", 3), dueAt("due-2", 2)];
    const queue = buildRecallQueue([...due, ...fresh(2)], now, {
      newLeft: 10,
      reviewsLeft: 2,
    });
    expect(ids(queue)).toEqual(["due-1", "due-2", "dsa-new-0", "dsa-new-1"]);
  });

  it("stops new cards too once the reviews cap is reached", () => {
    const due = dueAt("due-0", 1);
    expect(
      buildRecallQueue([due, ...fresh(2)], now, {
        newLeft: 10,
        reviewsLeft: 0,
      }),
    ).toEqual([]);
  });
});

describe("trackNewLeft", () => {
  it("subtracts what each limited track served today", () => {
    const left = trackNewLeft(
      { dsa: 3, design: 1 },
      new Map([
        ["dsa", 1],
        ["design", 4],
        ["behavioral", 2],
      ]),
    );
    expect([...left]).toEqual([
      ["dsa", 2],
      ["design", 0],
    ]);
  });
});
