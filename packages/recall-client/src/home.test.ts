import type { ContentResponse, RecallDueResponse } from "@meritory/contracts";
import { describe, expect, it } from "vitest";
import { allChapters } from "./content.ts";
import {
  nothingDueLine,
  plural,
  queueNote,
  queueParts,
  queueRows,
} from "./home.ts";

const content = {
  hash: "a".repeat(64),
  tracks: [
    {
      id: "dsa",
      title: "DSA",
      chapters: [
        { id: "second", title: "Second", order: 2, cards: [] },
        { id: "first", title: "First", order: 1, cards: [] },
      ],
    },
  ],
} as unknown as ContentResponse;

const counts = (
  chapterId: string,
  due: number,
  offered: number,
  fresh = offered,
) => ({
  trackId: "dsa",
  chapterId,
  due,
  new: fresh,
  offered,
  learned: 0,
  total: 20,
});

const dueWith = (
  chapters: RecallDueResponse["chapters"],
  more: Partial<RecallDueResponse> = {},
): RecallDueResponse => ({
  newLeftToday: 10,
  dueTomorrow: 0,
  overdue: 0,
  dayEndsAt: "2026-11-24T09:00:00.000Z",
  chapters,
  ...more,
});

describe("home queue", () => {
  it("lists chapters with cards for today in book order", () => {
    const rows = queueRows(
      dueWith([counts("second", 2, 0), counts("first", 0, 3)]),
      allChapters(content),
    );
    expect(rows.map((row) => row.chapter.id)).toEqual(["first", "second"]);
  });

  it("leaves out chapters with nothing for today", () => {
    const rows = queueRows(
      dueWith([counts("first", 0, 0, 5)]),
      allChapters(content),
    );
    expect(rows).toEqual([]);
  });

  it("words a row's counts", () => {
    expect(queueParts({ due: 3, offered: 7 })).toBe("3 to recall, 7 new");
    expect(queueParts({ due: 0, offered: 1 })).toBe("1 new");
    expect(plural(1, "card")).toBe("1 card");
    expect(plural(2, "card")).toBe("2 cards");
  });

  it("says what tomorrow brings when nothing is due", () => {
    expect(nothingDueLine(dueWith([]))).toBe("You've done today's cards.");
    expect(nothingDueLine(dueWith([], { dueTomorrow: 4 }))).toBe(
      "You've done today's cards. 4 come back tomorrow.",
    );
    expect(
      nothingDueLine(dueWith([counts("first", 0, 0, 5)], { dueTomorrow: 4 })),
    ).toBe(
      "You've done today's cards. 4 come back tomorrow, plus up to 10 new.",
    );
    expect(nothingDueLine(dueWith([counts("first", 0, 0, 5)]))).toBe(
      "You've done today's cards. Up to 10 new cards arrive tomorrow.",
    );
  });

  it("changes the queue note once cards wait from an earlier day", () => {
    expect(queueNote(dueWith([]))).toContain("up to 10 new cards a day");
    expect(queueNote(dueWith([], { overdue: 2 }))).toContain("oldest first");
  });
});
