"use client";

import type { RecallRating } from "@meritory/contracts";
import {
  promptOf,
  RATING_LABELS,
  RATINGS,
  type SittingCard,
  shortWait,
} from "@meritory/recall-client";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/button";
import { Markdown } from "@/components/markdown";
import type { PromptCard as PromptCardContent } from "@/lib/content";
import {
  CardActions,
  CardBox,
  FeedbackHeading,
  hasFinePointer,
  keyIsTaken,
  Lesson,
  MixUp,
  Prompt,
  ShortcutHint,
  useFocusOn,
} from "./parts";
import type { Checked } from "./sitting-types";

/** The points a good answer covers */
export function KeyPoints({
  points,
  headingRef,
}: {
  points: readonly string[];
  headingRef?: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className="text-h3 focus:outline-none"
      >
        Key points
      </h3>
      <ul className="flex list-disc flex-col gap-3 pl-5 marker:text-secondary">
        {points.map((point) => (
          <li key={point}>
            <Markdown text={point} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A free-recall card: answer, show the key points, then rate yourself */
export function PromptCard({
  item,
  card,
  now,
  checked,
  focusOnOpen,
  shortcuts,
  onToggleShortcuts,
  saving,
  onRate,
  onDontKnow,
  after,
}: {
  item: SittingCard;
  card: PromptCardContent;
  now: Date;
  /** Set once the card is rated Missed, to show its lesson */
  checked: Checked | null;
  focusOnOpen: boolean;
  shortcuts: boolean;
  onToggleShortcuts: () => void;
  saving: boolean;
  onRate: (rating: RecallRating) => void;
  onDontKnow: () => void;
  after: ReactNode;
}) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<HTMLHeadingElement>(null);
  const lessonRef = useRef<HTMLHeadingElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const answerId = useId();
  const legendId = useId();

  useFocusOn(promptRef, item.key, focusOnOpen);
  useFocusOn(pointsRef, revealed, false);
  useFocusOn(lessonRef, checked !== null, false);
  useFocusOn(headingRef, checked !== null, false);

  useEffect(() => {
    if (!shortcuts || !hasFinePointer()) return;
    function onKey(event: KeyboardEvent) {
      if (keyIsTaken(event)) return;
      if (!revealed && !checked && event.key === " ") {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      const rating = RATINGS[Number(event.key) - 1];
      if (revealed && rating && !saving && !checked) {
        event.preventDefault();
        onRate(rating);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts, revealed, saving, checked, onRate]);

  const typed = answer.trim();

  if (checked?.dontKnow) {
    return (
      <>
        <CardBox>
          <FeedbackHeading
            {...checked}
            focusRef={headingRef}
            showWait={false}
          />
          <Prompt text={promptOf(item)} answered />
          <KeyPoints points={card.points} />
          {card.misconception && <MixUp text={card.misconception} />}
          <Lesson card={card} missed wait={checked.wait} full={false} />
        </CardBox>
        {after}
      </>
    );
  }

  if (checked) {
    return (
      <>
        <CardBox>
          <Prompt text={promptOf(item)} answered />
          <Lesson
            card={card}
            missed
            wait={checked.wait}
            full={false}
            titleRef={lessonRef}
          />
        </CardBox>
        {after}
      </>
    );
  }

  return (
    <>
      <CardBox>
        <Prompt
          text={promptOf(item)}
          focusRef={promptRef}
          answered={revealed}
        />
        {revealed ? (
          <>
            <div className="flex flex-col gap-1 bg-sunken p-3">
              <h3 className="text-small font-semibold text-secondary">
                Your answer
              </h3>
              <p className="whitespace-pre-wrap break-words text-small">
                {typed ||
                  "Nothing typed or recorded. Compare the key points with what you thought."}
              </p>
            </div>
            <KeyPoints points={card.points} headingRef={pointsRef} />
            {card.misconception && <MixUp text={card.misconception} />}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor={answerId} className="text-small text-secondary">
              Answer in your own words, out loud or typed. A guess still helps.
            </label>
            <textarea
              id={answerId}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={4}
              maxLength={4000}
              className="focus-ring min-h-24 resize-y border border-border bg-card p-3 text-body"
            />
          </div>
        )}
      </CardBox>
      {revealed ? (
        <fieldset
          aria-labelledby={legendId}
          aria-busy={saving || undefined}
          className="flex flex-col gap-4"
        >
          <legend id={legendId} className="mb-4 text-small text-secondary">
            How did that go? Partly right counts as Missed.
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((rating) => (
              <button
                key={rating}
                type="button"
                disabled={saving}
                onClick={() => onRate(rating)}
                className="focus-ring flex min-h-16 flex-col items-center justify-center gap-1 border border-accent bg-card py-2 disabled:cursor-progress"
              >
                <span className="text-body font-semibold">
                  {RATING_LABELS[rating]}
                </span>
                <span className="font-mono text-small text-secondary">
                  {shortWait(now, new Date(item.session.next[rating]))}
                </span>
              </button>
            ))}
          </div>
          <ShortcutHint
            on={shortcuts}
            hint="You can also press 1, 2, 3, or 4."
            onToggle={onToggleShortcuts}
          />
        </fieldset>
      ) : (
        <div className="flex flex-col gap-4">
          <CardActions onDontKnow={onDontKnow} busy={saving}>
            <Button
              type="button"
              onClick={() => setRevealed(true)}
              className="w-full sm:w-50"
            >
              Show key points
            </Button>
          </CardActions>
          <ShortcutHint
            on={shortcuts}
            hint="You can also press Space to show key points."
            onToggle={onToggleShortcuts}
          />
        </div>
      )}
      {after}
    </>
  );
}
