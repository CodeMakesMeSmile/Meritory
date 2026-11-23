"use client";

import type { RecallRating } from "@meritory/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button, buttonClass, linkClass } from "@/components/button";
import { CountSquares } from "@/components/count-squares";
import {
  readStoppedAt,
  setShortcutsOn,
  shortcutsOn,
  writeStoppedAt,
} from "@/lib/device-storage";
import {
  loadDue,
  type ReviewToSave,
  saveReview,
  undoReview,
} from "@/lib/recall-api";
import {
  doneLine,
  lineAfterFailedUndo,
  lineAfterSave,
  RATING_LABELS,
  type SavedRating,
  type SittingCard,
  showsUndo,
  tomorrowLine,
  type UndoLine,
  undoRetryText,
} from "@/lib/recall-sitting";
import { longWait } from "@/lib/recall-time";
import { MatchingCard } from "./matching-card";
import { OrderingCard } from "./ordering-card";
import { PickOneCard } from "./pick-one-card";
import { PromptCard } from "./prompt-card";
import type { Checked } from "./sitting-types";

type Saving =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "failed"; review: ReviewToSave; refused: boolean };

export function UndoBar({
  line,
  onUndo,
  locked = false,
}: {
  line: UndoLine;
  onUndo: () => void;
  /** A rating is saving or failed to save, so Undo waits for it */
  locked?: boolean;
}) {
  if (line.kind === "kept") {
    return (
      <p className="flex min-h-control items-center text-small text-danger">
        {line.text}
      </p>
    );
  }
  const label = RATING_LABELS[line.rating];
  return (
    <div className="flex min-h-control flex-wrap items-center gap-x-2">
      <p
        className={`text-small ${line.offline ? "text-danger" : "text-secondary"}`}
      >
        {line.offline ? undoRetryText(line) : `Last card saved as ${label}.`}
      </p>
      <button
        type="button"
        onClick={onUndo}
        aria-disabled={line.busy || locked}
        aria-busy={line.busy || locked}
        aria-label={`Undo the ${label} rating`}
        className={`${linkClass} flex h-control items-center pr-5`}
      >
        Undo
      </button>
    </div>
  );
}

/** Ratings and checks wait while a save or an Undo is out, and after a failed save */
export function ratingsWait(saving: Saving, line: UndoLine | null): boolean {
  return saving.state !== "idle" || (line?.kind === "offer" && line.busy);
}

function plural(count: number, one: string) {
  return `${count} ${count === 1 ? one : `${one}s`}`;
}

function Done({
  count,
  saved,
  undo,
}: {
  count: number;
  saved: SavedRating[];
  undo: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [line, setLine] = useState<string | null>(null);
  const [tomorrow, setTomorrow] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
    writeStoppedAt(null);
    loadDue().then((result) => {
      const now = new Date();
      if (!result.ok) {
        setLine(doneLine(saved, now, null));
        return;
      }
      setLine(doneLine(saved, now, new Date(result.data.dayEndsAt)));
      const newWaiting = result.data.chapters.some((c) => c.new > 0);
      setTomorrow(tomorrowLine(result.data.dueTomorrow, newWaiting));
    });
  }, [saved]);

  return (
    <>
      <CountSquares filled={count} total={count} className="pt-2" />
      {undo}
      <div className="flex flex-col gap-4 border border-accent bg-card p-5 md:p-8">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-display focus:outline-none"
        >
          That's {plural(count, "card")} done
        </h1>
        {line && <p>{line}</p>}
        {tomorrow && (
          <div className="flex flex-col gap-1">
            <h2 className="text-small font-semibold">Next up</h2>
            <p>{tomorrow}</p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Link href="/" className={`${buttonClass()} w-full sm:w-50`}>
          Back to Home
        </Link>
      </div>
    </>
  );
}

/** One sitting of due cards, from the first card to the done screen */
export function Sitting({ items, now }: { items: SittingCard[]; now: string }) {
  const router = useRouter();
  const loadedAt = new Date(now);
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<Checked | null>(null);
  const [saving, setSaving] = useState<Saving>({ state: "idle" });
  const [saved, setSaved] = useState<SavedRating[]>([]);
  const [missedOnce, setMissedOnce] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [shortcuts, setShortcuts] = useState(true);
  const [line, setLine] = useState<UndoLine | null>(null);
  // After an Undo the card comes back with focus, even when it was the first
  const [undone, setUndone] = useState(false);
  // Cards done before Stop for now, when this sitting carries on from one
  const [before, setBefore] = useState<number | null>(null);
  const cardStart = useRef(Date.now());
  // Set before the first await, so a second press in the same frame waits too
  const inFlight = useRef(false);
  const failedBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShortcuts(shortcutsOn());
    setBefore(readStoppedAt()?.done ?? 0);
  }, []);

  // The box can open below the fold, so it scrolls in with Save again
  useEffect(() => {
    if (saving.state === "failed") {
      failedBox.current?.scrollIntoView({ block: "nearest" });
    }
  }, [saving.state]);

  const item = items[index];
  const offset = before ?? 0;
  const total = offset + items.length;

  const save = useCallback(
    async (review: ReviewToSave, advance: boolean) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSaving({ state: "saving" });
      const result = await saveReview(review).finally(() => {
        inFlight.current = false;
      });
      if (!result.ok) {
        if (result.reason === "signed_out") {
          router.replace(`/sign-in?next=${encodeURIComponent("/recall")}`);
          return;
        }
        setSaving({
          state: "failed",
          review,
          refused: result.refused === true,
        });
        return;
      }
      // Undone since it was sent, so it doesn't count and the sitting moves on
      if (result.data === null) {
        setSaving({ state: "idle" });
        setLine(null);
        if (advance) {
          setIndex((at) => at + 1);
          cardStart.current = Date.now();
        }
        return;
      }
      const { dueAt } = result.data;
      setSaved((list) => [
        ...list,
        {
          chapterTitle:
            items.find((i) => i.session === review.card)?.chapterTitle ?? "",
          dueAt: new Date(dueAt),
        },
      ]);
      setSaving({ state: "idle" });
      setAnnouncement(`Last card saved as ${RATING_LABELS[review.rating]}.`);
      setLine(lineAfterSave(items, review.card, review.id, review.rating));
      if (advance) {
        setIndex((at) => at + 1);
        cardStart.current = Date.now();
      }
    },
    [items, router],
  );

  const review = useCallback(
    (rating: RecallRating): ReviewToSave | null =>
      item
        ? {
            id: crypto.randomUUID(),
            card: item.session,
            rating,
            answeredAt: new Date(),
            durationMs: Date.now() - cardStart.current,
          }
        : null,
    [item],
  );

  // Missed on a free-answer card shows its lesson before the next card
  const rate = useCallback(
    (rating: RecallRating) => {
      const next = review(rating);
      if (!next || !item || inFlight.current || saving.state !== "idle") {
        return;
      }
      const missed = rating === "again";
      if (missed) {
        setChecked({
          right: false,
          encourage: false,
          wait: longWait(loadedAt, new Date(item.session.next.again)),
        });
      }
      save(next, !missed);
    },
    [review, save, saving.state, item, loadedAt],
  );

  function check(right: boolean) {
    if (!item || inFlight.current || saving.state !== "idle") return;
    const rating: RecallRating = right ? "good" : "again";
    setChecked({
      right,
      encourage: !right && !missedOnce,
      wait: longWait(loadedAt, new Date(item.session.next[rating])),
    });
    if (!right) setMissedOnce(true);
    const next = review(rating);
    if (next) save(next, false);
  }

  function nextCard() {
    setChecked(null);
    setIndex((at) => at + 1);
    cardStart.current = Date.now();
  }

  // Moves on from a rating the API turned down for good, leaving the card as it was
  function skipUnsaved() {
    setSaving({ state: "idle" });
    setLine(null);
    setAnnouncement("That rating wasn't saved.");
    nextCard();
  }

  async function undo() {
    if (line?.kind !== "offer" || inFlight.current) return;
    if (saving.state !== "idle") return;
    inFlight.current = true;
    setLine({ ...line, busy: true });
    const result = await undoReview(line.id).finally(() => {
      inFlight.current = false;
    });
    if (result.ok) {
      setSaved((list) => list.slice(0, -1));
      setLine(null);
      setChecked(null);
      setUndone(true);
      setIndex(line.at);
      cardStart.current = Date.now();
      setAnnouncement("Rating undone.");
      return;
    }
    if (result.reason === "signed_out") {
      router.replace(`/sign-in?next=${encodeURIComponent("/recall")}`);
      return;
    }
    const next = lineAfterFailedUndo(line, result.code);
    setLine(next);
    setAnnouncement(next.kind === "kept" ? next.text : undoRetryText(next));
  }

  function toggleShortcuts() {
    setShortcutsOn(!shortcuts);
    setShortcuts(!shortcuts);
  }

  function stop() {
    writeStoppedAt({ done: offset + saved.length, total });
  }

  const liveRegion = (
    <p aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );

  const undoBar =
    line && showsUndo(line, index) ? (
      <UndoBar
        line={line}
        locked={saving.state !== "idle"}
        onUndo={() => void undo()}
      />
    ) : null;

  if (!item) {
    return (
      <>
        <Done count={offset + saved.length} saved={saved} undo={undoBar} />
        {liveRegion}
      </>
    );
  }

  const busy = ratingsWait(saving, line);
  const failed = saving.state === "failed" ? saving.review : null;
  const refused = saving.state === "failed" && saving.refused;
  const after = (
    <>
      {failed && refused && (
        <div
          ref={failedBox}
          role="alert"
          className="flex flex-col gap-3 border border-danger bg-card p-4"
        >
          <h2 className="text-small font-semibold text-danger">
            That rating can't be saved
          </h2>
          <p className="text-small">
            We couldn't record {RATING_LABELS[failed.rating]} for this card, and
            trying again won't change that. Your earlier answers are saved, and
            this card stays in your queue.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={skipUnsaved}
            className="self-start"
          >
            Next card
          </Button>
        </div>
      )}
      {failed && !refused && (
        <div
          ref={failedBox}
          role="alert"
          className="flex flex-col gap-3 border border-danger bg-card p-4"
        >
          <h2 className="text-small font-semibold text-danger">
            That rating didn't save
          </h2>
          <p className="text-small">
            The connection dropped before {RATING_LABELS[failed.rating]} reached
            us. Your answer is still here.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              save(
                failed,
                item.card.type === "prompt" && failed.rating !== "again",
              )
            }
            className="self-start"
          >
            Save again
          </Button>
        </div>
      )}
      {checked && !failed && (
        <div className="flex justify-end">
          <Button
            type="button"
            waiting={busy}
            onClick={() =>
              !inFlight.current && saving.state === "idle" && nextCard()
            }
            className="w-full sm:w-50"
          >
            Next card
          </Button>
        </div>
      )}
    </>
  );

  const shared = {
    item,
    focusOnOpen: index > 0 || undone,
    after,
  };
  const card = item.card;

  return (
    <>
      <h1 className="sr-only">Recall</h1>
      <div className="flex flex-col gap-4">
        <div className="flex h-control items-center justify-between">
          <Link
            href="/"
            onClick={stop}
            className={`${linkClass} flex h-control items-center`}
          >
            Stop for now
          </Link>
          {before !== null && (
            <p className="font-mono text-small text-secondary">
              {offset + index + 1} of {total}
            </p>
          )}
        </div>
        <CountSquares
          filled={before === null ? 0 : offset + index + 1}
          total={total}
        />
      </div>
      {undoBar}
      {card.type === "prompt" ? (
        <PromptCard
          key={item.key}
          {...shared}
          card={card}
          now={loadedAt}
          checked={checked}
          shortcuts={shortcuts}
          onToggleShortcuts={toggleShortcuts}
          saving={busy}
          onRate={rate}
        />
      ) : card.type === "pick-one" ? (
        <PickOneCard
          key={item.key}
          {...shared}
          card={card}
          checked={checked}
          busy={busy}
          onCheck={check}
        />
      ) : card.type === "ordering" ? (
        <OrderingCard
          key={item.key}
          {...shared}
          card={card}
          checked={checked}
          busy={busy}
          onCheck={check}
        />
      ) : (
        <MatchingCard
          key={item.key}
          {...shared}
          card={card}
          checked={checked}
          busy={busy}
          onCheck={check}
        />
      )}
      {liveRegion}
    </>
  );
}
