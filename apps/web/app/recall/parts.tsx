"use client";

import { isSafeUrl } from "@meritory/content/markdown";
import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { linkClass } from "@/components/button";
import { Markdown } from "@/components/markdown";
import type { Card } from "@/lib/content";

/** The ink-ruled box each card sits in */
export function CardBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 border border-accent bg-card p-5 md:p-8">
      {children}
    </div>
  );
}

/** Moves focus to the ref when the card opens or its step changes */
export function useFocusOn(
  ref: RefObject<HTMLElement | null>,
  when: unknown,
  enabled: boolean,
) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!enabled) return;
    }
    ref.current?.focus();
  }, [ref, when, enabled]);
}

/** The question, smaller once it's answered so the answer leads */
export function Prompt({
  text,
  focusRef,
  answered = false,
}: {
  text: string;
  focusRef?: RefObject<HTMLDivElement | null>;
  answered?: boolean;
}) {
  return (
    <div
      ref={focusRef}
      tabIndex={-1}
      className={`${answered ? "font-semibold" : "text-prompt"} focus:outline-none`}
    >
      <Markdown text={text} />
    </div>
  );
}

/** When the card comes back, such as "You'll get another go in 1 minute." */
export function waitLine(right: boolean, wait: string) {
  return right
    ? `You'll see this again in ${wait}.`
    : `You'll get another go in ${wait}.`;
}

/** Got it or Not quite, with when the card comes back unless the lesson says it */
export function FeedbackHeading({
  right,
  encourage,
  wait,
  focusRef,
  showWait = true,
}: {
  right: boolean;
  encourage: boolean;
  wait: string | null;
  focusRef: RefObject<HTMLHeadingElement | null>;
  showWait?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 ref={focusRef} tabIndex={-1} className="text-h3 focus:outline-none">
        {right ? "Got it" : "Not quite"}
      </h2>
      {encourage && (
        <p className="text-small text-secondary">
          Trying first, then checking the answer, helps it stick.
        </p>
      )}
      {showWait && wait !== null && (
        <p className="text-small text-secondary">{waitLine(right, wait)}</p>
      )}
    </div>
  );
}

/** A small labelled note, such as the common mix-up */
function Note({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-small font-semibold">{label}</h3>
      <Markdown text={text} className="text-small" />
    </div>
  );
}

export function MixUp({ text }: { text: string }) {
  return <Note label="Common mix-up" text={text} />;
}

/** What the card teaches, with when it comes back under the title */
export function Lesson({
  card,
  missed,
  wait,
  full = true,
  titleRef,
}: {
  card: Card;
  missed: boolean;
  wait: string | null;
  /** With the mix-up and source, which a free-answer card already showed or leaves out */
  full?: boolean;
  titleRef?: RefObject<HTMLHeadingElement | null>;
}) {
  const { lesson } = card;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
          className="text-h2 focus:outline-none"
        >
          {lesson.title}
        </h3>
        {wait !== null && (
          <p className="text-small text-secondary">{waitLine(!missed, wait)}</p>
        )}
      </div>
      <Markdown text={lesson.explanation} />
      {missed && lesson.fix && <Note label="Next time" text={lesson.fix} />}
      {missed && full && card.misconception && (
        <MixUp text={card.misconception} />
      )}
      {full && lesson.source && isSafeUrl(lesson.source.url) && (
        <a
          href={lesson.source.url}
          rel="noreferrer"
          className={`${linkClass} flex min-h-control items-center self-start`}
        >
          {lesson.source.title}
        </a>
      )}
    </div>
  );
}

/** Just the lesson's explanation, under a checked order or set of matches */
export function Explanation({ card }: { card: Card }) {
  return (
    <Markdown
      text={card.lesson.explanation}
      className="text-small text-secondary"
    />
  );
}

/**
 * Whether the device has a mouse or trackpad. Without one there are no
 * shortcuts, since a speech tool could press keys with no way to turn them off
 */
export function hasFinePointer() {
  return window.matchMedia("(any-pointer: fine)").matches;
}

/** The hint line for single-key shortcuts, with a way to turn them off */
export function ShortcutHint({
  on,
  hint,
  onToggle,
}: {
  on: boolean;
  hint: string;
  onToggle: () => void;
}) {
  return (
    <div className="hidden flex-wrap items-center gap-x-8 any-pointer-fine:flex">
      <p className="text-small text-secondary">
        {on ? hint : "Keyboard shortcuts are off."}
      </p>
      <button
        type="button"
        onClick={onToggle}
        className={`${linkClass} h-control`}
      >
        {on ? "Turn off shortcuts" : "Turn on shortcuts"}
      </button>
    </div>
  );
}

/** Whether a key press belongs to a field or control, not to a shortcut */
export function keyIsTaken(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
    return true;
  }
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  if (target.isContentEditable) return true;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return true;
  // Space already presses a focused button or link
  return event.key === " " && /^(BUTTON|A|SUMMARY)$/.test(target.tagName);
}
