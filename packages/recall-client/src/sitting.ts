import type {
  ContentResponse,
  RecallRating,
  RecallSessionResponse,
} from "@meritory/contracts";
import { waitMessage } from "@meritory/contracts/sign-in-messages";
import { type Card, findChapter } from "./content.ts";
import { longWait } from "./time.ts";

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
/** What a card shows once I don't know is pressed */
export interface DontKnowResult {
  rating: RecallRating;
  checked: {
    right: false;
    dontKnow: true;
    /** The reminder that trying first helps, on the sitting's first miss only */
    encourage: boolean;
    wait: string;
  };
}

/** I don't know saves Missed, like a blank answer in Anki, and shows the answer */
export function dontKnowResult(
  item: SittingCard,
  loadedAt: Date,
  missedOnce: boolean,
): DontKnowResult {
  return {
    rating: "again",
    checked: {
      right: false,
      dontKnow: true,
      encourage: !missedOnce,
      wait: longWait(loadedAt, new Date(item.session.next.again)),
    },
  };
}

export function promptOf(item: SittingCard): string {
  return item.session.retry ? item.card.reworded : item.card.prompt;
}

export interface SavedRating {
  chapterTitle: string;
  dueAt: Date;
}

/**
 * The done screen's line about this sitting. Cards back before today's recall
 * day ends count as one more look. Without the day's end, it only praises.
 */
export function doneLine(
  saved: readonly SavedRating[],
  now: Date,
  dayEndsAt: Date | null,
): string {
  const counts = new Map<string, number>();
  for (const { chapterTitle } of saved) {
    counts.set(chapterTitle, (counts.get(chapterTitle) ?? 0) + 1);
  }
  const chapter = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  const praise = chapter
    ? `Nice steady work on ${chapter}.`
    : "Nice steady work.";
  if (!dayEndsAt) return praise;
  const soon = saved.filter(({ dueAt }) => dueAt < dayEndsAt);
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

// Copied so the page doesn't bundle the schema library. A test keeps them equal.
export const UNDO_ERRORS = {
  notLatest: "not_latest_review",
  undoExpired: "undo_expired",
} as const;

/** Why an Undo didn't happen, or null when trying again could still work */
export function undoKeptText(
  code: string | undefined,
  rating: RecallRating,
): string | null {
  if (code === UNDO_ERRORS.notLatest) {
    return "That card was rated again on another device, so this rating stays.";
  }
  if (code === UNDO_ERRORS.undoExpired) {
    return `Undo has run out for that card, so it stays as ${RATING_LABELS[rating]}.`;
  }
  return null;
}

export const UNDO_OFFLINE =
  "Undo didn't reach us. Check your connection, then try again.";

/** What an offer says after an Undo that could still work on another try */
export const undoRetryText = (line: { limited?: boolean }) =>
  line.limited ? waitMessage(null) : UNDO_OFFLINE;

/** The line above the next card after a free-answer rating, at that card's place */
export type UndoLine =
  | {
      kind: "offer";
      id: string;
      rating: RecallRating;
      at: number;
      busy: boolean;
      offline: boolean;
      /** The rate limit turned the last Undo away, so the connection isn't the cause */
      limited?: boolean;
    }
  | { kind: "kept"; text: string; at: number };

export type UndoOffer = Extract<UndoLine, { kind: "offer" }>;

/** Offers Undo after a rating that was tapped: a free-answer rating or I don't know */
export function lineAfterSave(
  items: readonly SittingCard[],
  card: SessionCard,
  id: string,
  rating: RecallRating,
  dontKnow = false,
): UndoLine | null {
  const at = items.findIndex((item) => item.session === card);
  if (!dontKnow && items[at]?.card.type !== "prompt") return null;
  return { kind: "offer", id, rating, at, busy: false, offline: false };
}

/** A refused Undo keeps the rating, and one that didn't arrive can be tried again */
export function lineAfterFailedUndo(
  line: UndoOffer,
  code: string | undefined,
): UndoLine {
  const kept = undoKeptText(code, line.rating);
  return kept
    ? { kind: "kept", text: kept, at: line.at }
    : {
        ...line,
        busy: false,
        offline: true,
        limited: code === "rate_limited" ? true : undefined,
      };
}

/** The line shows on the card right after the rated one, or on the done screen */
export const showsUndo = (line: UndoLine | null, index: number) =>
  line !== null && index === line.at + 1;
