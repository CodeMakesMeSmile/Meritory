import { describe, expect, it } from "vitest";
import { buildRecallQueue } from "./queue.ts";
import { newRecallCard, reviewRecallCard } from "./scheduler.ts";

const now = new Date("2026-11-18T09:00:00Z");
const day = 24 * 60 * 60 * 1000;
const start = new Date("2026-01-01T09:00:00Z");

function fresh(count: number) {
  return Array.from({ length: count }, (_, i) =>
    newRecallCard(`new-${i}`, now),
  );
}

function dueAt(id: string, daysAgo: number) {
  const reviewed = reviewRecallCard(
    newRecallCard(id, start),
    "easy",
    start,
  ).card;
  return { ...reviewed, dueAt: new Date(now.getTime() - daysAgo * day) };
}

describe("buildRecallQueue", () => {
  it("puts due cards first, then ten new cards", () => {
    const due = [dueAt("due-0", 1), dueAt("due-1", 3), dueAt("due-2", 2)];
    const queue = buildRecallQueue([...fresh(15), ...due], now, 0);
    expect(queue.map((card) => card.cardId)).toEqual([
      "due-1",
      "due-2",
      "due-0",
      ...fresh(10).map((card) => card.cardId),
    ]);
  });

  it("leaves out cards that aren't due yet", () => {
    const later = dueAt("later", -1);
    expect(buildRecallQueue([later], now, 0)).toEqual([]);
  });

  it("counts today's new cards against the allowance", () => {
    expect(buildRecallQueue(fresh(15), now, 7)).toHaveLength(3);
    expect(buildRecallQueue(fresh(15), now, 10)).toEqual([]);
    expect(buildRecallQueue(fresh(15), now, 12)).toEqual([]);
  });

  it("still shows due cards once the new cards run out", () => {
    const due = dueAt("due-0", 1);
    expect(buildRecallQueue([...fresh(3), due], now, 10)).toEqual([due]);
  });
});
