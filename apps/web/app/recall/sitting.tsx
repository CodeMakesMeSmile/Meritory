"use client";

import type { RecallRating } from "@meritory/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonClass, linkClass } from "@/components/button";
import { CountSquares } from "@/components/count-squares";
import {
  readStoppedAt,
  setShortcutsOn,
  shortcutsOn,
  writeStoppedAt,
} from "@/lib/device-storage";
import { loadDue, type ReviewToSave, saveReview } from "@/lib/recall-api";
import {
  doneLine,
  RATING_LABELS,
  type SavedRating,
  type SittingCard,
  tomorrowLine,
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
  | { state: "failed"; review: ReviewToSave };

function plural(count: number, one: string) {
  return `${count} ${count === 1 ? one : `${one}s`}`;
}

function Done({ count, saved }: { count: number; saved: SavedRating[] }) {
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
  // Cards done before Stop for now, when this sitting carries on from one
  const [before, setBefore] = useState<number | null>(null);
  const cardStart = useRef(Date.now());

  useEffect(() => {
    setShortcuts(shortcutsOn());
    setBefore(readStoppedAt()?.done ?? 0);
  }, []);

  const item = items[index];
  const offset = before ?? 0;
  const total = offset + items.length;

  const save = useCallback(
    async (review: ReviewToSave, advance: boolean) => {
      setSaving({ state: "saving" });
      const result = await saveReview(review);
      if (!result.ok) {
        if (result.reason === "signed_out") {
          router.replace(`/sign-in?next=${encodeURIComponent("/recall")}`);
          return;
        }
        setSaving({ state: "failed", review });
        return;
      }
      setSaved((list) => [
        ...list,
        {
          chapterTitle:
            items.find((i) => i.session === review.card)?.chapterTitle ?? "",
          dueAt: new Date(result.data.dueAt),
        },
      ]);
      setSaving({ state: "idle" });
      setAnnouncement(`Last card saved as ${RATING_LABELS[review.rating]}.`);
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
      if (!next || !item || saving.state === "saving") return;
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
    if (!item) return;
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

  if (!item) {
    return (
      <>
        <Done count={offset + saved.length} saved={saved} />
        {liveRegion}
      </>
    );
  }

  const failed = saving.state === "failed" ? saving.review : null;
  const after = (
    <>
      {failed && (
        <div
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
            waiting={saving.state === "saving"}
            onClick={() => saving.state === "idle" && nextCard()}
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
    focusOnOpen: index > 0,
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
      {card.type === "prompt" ? (
        <PromptCard
          key={item.key}
          {...shared}
          card={card}
          now={loadedAt}
          checked={checked}
          shortcuts={shortcuts}
          onToggleShortcuts={toggleShortcuts}
          saving={saving.state === "saving"}
          onRate={rate}
        />
      ) : card.type === "pick-one" ? (
        <PickOneCard
          key={item.key}
          {...shared}
          card={card}
          checked={checked}
          onCheck={check}
        />
      ) : card.type === "ordering" ? (
        <OrderingCard
          key={item.key}
          {...shared}
          card={card}
          checked={checked}
          onCheck={check}
        />
      ) : (
        <MatchingCard
          key={item.key}
          {...shared}
          card={card}
          checked={checked}
          onCheck={check}
        />
      )}
      {liveRegion}
    </>
  );
}
