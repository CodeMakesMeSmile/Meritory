import type {
  ContentResponse,
  RecallSessionResponse,
} from "@meritory/contracts";
import { describe, expect, it } from "vitest";
import {
  matchingIsRight,
  orderingIsRight,
  ordinal,
  shuffled,
} from "./recall-grading";
import {
  doneLine,
  promptOf,
  sittingCards,
  tomorrowLine,
} from "./recall-sitting";
import { longWait, shortWait } from "./recall-time";

const at = (iso: string) => new Date(iso);
const NOW = at("2026-11-19T15:00:00Z");
const later = (ms: number) => new Date(NOW.getTime() + ms);
const MIN = 60_000;

describe("shuffled", () => {
  const items = ["a", "b", "c", "d", "e", "f"];

  it("keeps every item and gives the same order for the same seed", () => {
    const once = shuffled(items, "seed");
    expect([...once].sort()).toEqual(items);
    expect(shuffled(items, "seed")).toEqual(once);
  });

  it("gives another order for another seed", () => {
    const orders = new Set(
      ["a", "b", "c", "d", "e"].map((seed) => shuffled(items, seed).join("")),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("leaves the input alone", () => {
    shuffled(items, "seed");
    expect(items).toEqual(["a", "b", "c", "d", "e", "f"]);
  });
});

describe("grading", () => {
  it("checks an order", () => {
    expect(orderingIsRight([0, 1, 2], 3)).toBe(true);
    expect(orderingIsRight([0, 2, 1], 3)).toBe(false);
    expect(orderingIsRight([0, 1], 3)).toBe(false);
  });

  it("names a place", () => {
    expect([0, 1, 2, 3, 10, 11, 12, 20, 21].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
    ]);
  });

  it("checks matches", () => {
    expect(matchingIsRight(["O(1)", "O(n)"], ["O(1)", "O(n)"])).toBe(true);
    expect(matchingIsRight(["O(n)", "O(1)"], ["O(1)", "O(n)"])).toBe(false);
    expect(matchingIsRight(["O(1)", null], ["O(1)", "O(n)"])).toBe(false);
  });
});

describe("waits", () => {
  it("rounds to the largest unit, never below a minute", () => {
    expect(shortWait(NOW, later(10 * 1000))).toBe("1 min");
    expect(shortWait(NOW, later(-MIN))).toBe("1 min");
    expect(shortWait(NOW, later(6 * MIN))).toBe("6 min");
    expect(shortWait(NOW, later(90 * MIN))).toBe("2 h");
    expect(shortWait(NOW, later(54 * 24 * 60 * MIN))).toBe("54 d");
  });

  it("says it in words", () => {
    expect(longWait(NOW, later(MIN))).toBe("1 minute");
    expect(longWait(NOW, later(10 * MIN))).toBe("10 minutes");
    expect(longWait(NOW, later(24 * 60 * MIN))).toBe("1 day");
  });
});

const content = {
  hash: "h",
  tracks: [
    {
      id: "dsa",
      title: "DSA",
      rubrics: [],
      chapters: [
        {
          id: "arrays",
          title: "Arrays and hashing",
          cards: [{ id: "slice", prompt: "First", reworded: "Again" }],
        },
      ],
    },
  ],
} as unknown as ContentResponse;

function sessionCard(cardId: string, retry = false) {
  return {
    trackId: "dsa",
    chapterId: "arrays",
    cardId,
    version: 1,
    isNew: false,
    retry,
    dueAt: NOW.toISOString(),
    next: { again: "", hard: "", good: "", easy: "" },
  };
}

describe("sittingCards", () => {
  it("pairs due cards with their words and drops any the bundle lost", () => {
    const session = {
      newLeftToday: 10,
      cards: [sessionCard("slice"), sessionCard("gone")],
    } as RecallSessionResponse;
    const items = sittingCards(content, session);
    expect(items.map((i) => i.key)).toEqual(["dsa/arrays/slice"]);
    expect(items[0]?.chapterTitle).toBe("Arrays and hashing");
  });

  it("asks a missed card in other words", () => {
    const [first] = sittingCards(content, {
      newLeftToday: 0,
      cards: [sessionCard("slice", true)],
    } as RecallSessionResponse);
    expect(first && promptOf(first)).toBe("Again");
  });
});

describe("done screen", () => {
  const saved = (title: string, ms: number) => ({
    chapterTitle: title,
    dueAt: later(ms),
  });

  it("names the main chapter and the cards coming back soon", () => {
    expect(
      doneLine(
        [
          saved("Arrays and hashing", MIN),
          saved("Arrays and hashing", 10 * MIN),
          saved("Two pointers", 3 * 24 * 60 * MIN),
        ],
        NOW,
      ),
    ).toBe(
      "Nice steady work on Arrays and hashing. 2 cards come back within 10 minutes for one more look.",
    );
  });

  it("says when nothing else is due today", () => {
    expect(doneLine([saved("Two pointers", 2 * 24 * 60 * MIN)], NOW)).toBe(
      "Nice steady work on Two pointers. Nothing else is due today.",
    );
  });

  it("says what tomorrow holds, or nothing", () => {
    expect(tomorrowLine(4, true)).toBe(
      "Tomorrow: 4 to recall and up to 10 new",
    );
    expect(tomorrowLine(0, true)).toBe("Tomorrow: up to 10 new");
    expect(tomorrowLine(3, false)).toBe("Tomorrow: 3 to recall");
    expect(tomorrowLine(0, false)).toBeNull();
  });
});
