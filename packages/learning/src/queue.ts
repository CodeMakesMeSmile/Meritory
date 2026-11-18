import type { RecallCard } from "./scheduler.ts";

export const NEW_CARDS_PER_DAY = 10;

type QueueCard = Pick<RecallCard, "dueAt" | "scheduleStatus">;

/**
 * Due cards first, longest overdue first, then new cards in the order given,
 * up to what is left of today's new card allowance
 */
export function buildRecallQueue<T extends QueueCard>(
  cards: readonly T[],
  now: Date,
  newSeenToday: number,
): T[] {
  const due = cards
    .filter(
      (card) =>
        card.scheduleStatus !== "new" && card.dueAt.getTime() <= now.getTime(),
    )
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const allowance = Math.max(0, NEW_CARDS_PER_DAY - newSeenToday);
  const fresh = cards
    .filter((card) => card.scheduleStatus === "new")
    .slice(0, allowance);
  return [...due, ...fresh];
}
