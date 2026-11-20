import type {
  ContentResponse,
  RecallRating,
  RecallSessionResponse,
} from "@meritory/contracts";
import { type Card, findChapter } from "./content";
import { longWait } from "./recall-time";

export type SessionCard = RecallSessionResponse["cards"][number];

/** A due card with the words it shows */
export interface SittingCard {
  key: string;
  session: SessionCard;
  card: Card;
  chapterTitle: string;
}

export const RATINGS: readonly RecallRating[] = [
  "again",
  "hard",
  "good",
  "easy",
];

export const RATING_LABELS: Record<RecallRating, string> = {
  again: "Missed",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

/** Due cards in the API's order, leaving out any the bundle no longer has */
export function sittingCards(
  content: ContentResponse,
  session: RecallSessionResponse,
): SittingCard[] {
  return session.cards.flatMap((session) => {
    const found = findChapter(content, session.trackId, session.chapterId);
    const card = found?.chapter.cards.find((c) => c.id === session.cardId);
    if (!found || !card) return [];
    return [
      {
        key: `${session.trackId}/${session.chapterId}/${session.cardId}`,
        session,
        card,
        chapterTitle: found.chapter.title,
      },
    ];
  });
}

/** After a miss, the card asks the same thing in other words */
export function promptOf(item: SittingCard): string {
  return item.session.retry ? item.card.reworded : item.card.prompt;
}

export interface SavedRating {
  chapterTitle: string;
  dueAt: Date;
}

/** Cards back within this long count as one more look today */
const SOON = 60 * 60 * 1000;

/** The done screen's line about this sitting */
export function doneLine(saved: readonly SavedRating[], now: Date): string {
  const counts = new Map<string, number>();
  for (const { chapterTitle } of saved) {
    counts.set(chapterTitle, (counts.get(chapterTitle) ?? 0) + 1);
  }
  const chapter = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  const praise = chapter
    ? `Nice steady work on ${chapter}.`
    : "Nice steady work.";
  const soon = saved.filter(
    ({ dueAt }) => dueAt.getTime() - now.getTime() <= SOON,
  );
  if (soon.length === 0) return `${praise} Nothing else is due today.`;
  const last = new Date(Math.max(...soon.map(({ dueAt }) => dueAt.getTime())));
  const cards =
    soon.length === 1 ? "1 card comes" : `${soon.length} cards come`;
  return `${praise} ${cards} back within ${longWait(now, last)} for one more look.`;
}

/** The done screen's Next up line, or null when nothing is waiting */
export function tomorrowLine(dueTomorrow: number, newWaiting: boolean) {
  const parts = [
    dueTomorrow > 0 ? `${dueTomorrow} to recall` : null,
    newWaiting ? "up to 10 new" : null,
  ].filter(Boolean);
  return parts.length > 0 ? `Tomorrow: ${parts.join(" and ")}` : null;
}
