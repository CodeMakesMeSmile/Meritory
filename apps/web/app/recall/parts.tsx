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

export function Prompt({
  text,
  focusRef,
}: {
  text: string;
  focusRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={focusRef}
      tabIndex={-1}
      className="text-prompt focus:outline-none"
    >
      <Markdown text={text} />
    </div>
  );
}

/** Got it or Not quite, with when the card comes back */
export function FeedbackHeading({
  right,
  encourage,
  wait,
  focusRef,
}: {
  right: boolean;
  encourage: boolean;
  wait: string;
  focusRef: RefObject<HTMLHeadingElement | null>;
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
      <p className="text-small text-secondary">
        {right
          ? `You'll see this again in ${wait}.`
          : `You'll get another go in ${wait}.`}
      </p>
    </div>
  );
}

export function MixUp({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-small font-semibold">Common mix-up</h3>
      <Markdown text={text} className="text-small" />
    </div>
  );
}

/** What the card teaches, shown after an answer is checked */
export function Lesson({ card, missed }: { card: Card; missed: boolean }) {
  const { lesson } = card;
  return (
    <div className="flex flex-col gap-4 border-t border-border-subtle pt-5">
      <h3 className="text-h2">{lesson.title}</h3>
      <Markdown text={lesson.explanation} />
      {missed && card.misconception && <MixUp text={card.misconception} />}
      {lesson.source && isSafeUrl(lesson.source.url) && (
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
    <div className="flex flex-wrap items-center gap-x-8">
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
