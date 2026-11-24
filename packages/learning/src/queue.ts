import type { RecallCard } from "./scheduler.ts";
import { SUGGESTED_SETTINGS } from "./settings.ts";

export const NEW_CARDS_PER_DAY = SUGGESTED_SETTINGS.newCardsPerDay;

type QueueCard = Pick<RecallCard, "dueAt" | "scheduleStatus"> & {
  trackId: string;
};

/** What is left of today's allowances when the queue is built */
export interface QueueLimits {
  /** New cards still allowed today across every track */
  newLeft: number;
  /** New cards still allowed today for tracks with a limit of their own */
  trackNewLeft?: ReadonlyMap<string, number>;
  /** Reviews still allowed today, or null for no cap */
  reviewsLeft?: number | null;
}

/** New cards left for each limited track, from its limit and what it served today */
export function trackNewLeft(
  limits: Record<string, number>,
  seenToday: ReadonlyMap<string, number>,
): Map<string, number> {
  return new Map(
    Object.entries(limits).map(([track, limit]) => [
      track,
      Math.max(0, limit - (seenToday.get(track) ?? 0)),
    ]),
  );
}

/**
 * Due cards first, longest overdue first, then new cards in the order given,
 * up to what is left of today's allowances. Once the reviews cap is reached,
 * new cards stop for the day too.
 */
export function buildRecallQueue<T extends QueueCard>(
  cards: readonly T[],
  now: Date,
  limits: QueueLimits,
): T[] {
  const reviewsLeft = limits.reviewsLeft ?? null;
  const due = cards
    .filter(
      (card) =>
        card.scheduleStatus !== "new" && card.dueAt.getTime() <= now.getTime(),
    )
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, reviewsLeft ?? undefined);
  if (reviewsLeft !== null && reviewsLeft <= 0) return due;
  let newLeft = Math.max(0, limits.newLeft);
  const perTrack = new Map(limits.trackNewLeft ?? []);
  const fresh: T[] = [];
  for (const card of cards) {
    if (newLeft === 0) break;
    if (card.scheduleStatus !== "new") continue;
    const trackLeft = perTrack.get(card.trackId);
    if (trackLeft === 0) continue;
    if (trackLeft !== undefined) perTrack.set(card.trackId, trackLeft - 1);
    newLeft -= 1;
    fresh.push(card);
  }
  return [...due, ...fresh];
}
