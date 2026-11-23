"use client";

import {
  orderingIsRight,
  ordinal,
  promptOf,
  type SittingCard,
  shuffled,
} from "@meritory/recall-client";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { Button, linkClass } from "@/components/button";
import { Markdown } from "@/components/markdown";
import type { OrderingCard as OrderingContent } from "@/lib/content";
import {
  CardBox,
  Explanation,
  FeedbackHeading,
  Prompt,
  useFocusOn,
} from "./parts";
import type { Checked } from "./sitting-types";

type Term = NonNullable<OrderingContent["terms"]>[number];

const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A step's words, with each defined term as a button that shows its meaning.
 * Terms are found in the rendered words, so formatting and code stay intact
 */
function StepText({
  text,
  terms,
  onTerm,
}: {
  text: string;
  terms: readonly Term[];
  onTerm: (term: Term) => void;
}) {
  if (terms.length === 0) return <Markdown text={text} inline />;
  const longestFirst = [...terms].sort((a, b) => b.term.length - a.term.length);
  const pattern = new RegExp(
    `(${longestFirst.map((t) => escapeRegex(t.term)).join("|")})`,
    "gi",
  );
  const mark = (words: string) =>
    words.split(pattern).map((part, at) => {
      const term = longestFirst.find(
        (t) => t.term.toLowerCase() === part.toLowerCase(),
      );
      return term ? (
        <button
          key={at}
          type="button"
          onClick={() => onTerm(term)}
          className="focus-ring text-gold underline underline-offset-2"
        >
          {part}
        </button>
      ) : (
        part
      );
    });
  return <Markdown text={text} inline renderText={mark} />;
}

/** Put the steps in order by tapping them from first to last */
export function OrderingCard({
  item,
  card,
  focusOnOpen,
  checked,
  onCheck,
  busy,
  after,
}: {
  item: SittingCard;
  card: OrderingContent;
  focusOnOpen: boolean;
  checked: Checked | null;
  onCheck: (right: boolean) => void;
  /** Another save or Undo is still on its way */
  busy: boolean;
  after: ReactNode;
}) {
  // Steps are known by their right place, starting at 0
  const shown = useMemo(
    () =>
      shuffled(
        card.steps.map((_, at) => at),
        `${item.key}:${item.session.dueAt}`,
      ),
    [card.steps, item.key, item.session.dueAt],
  );
  const [placed, setPlaced] = useState<number[]>([]);
  const [term, setTerm] = useState<Term | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const terms = card.terms ?? [];

  useFocusOn(promptRef, item.key, focusOnOpen);
  useFocusOn(headingRef, checked !== null, false);

  const left = shown.filter((step) => !placed.includes(step));
  const done = left.length === 0;

  const order = (
    <ol className="flex flex-col gap-2">
      {placed.map((step, at) => {
        const wrong = checked !== null && step !== at;
        return (
          <li
            key={step}
            className={`flex items-start gap-3 px-3 py-3 ${wrong ? "border border-danger" : "bg-sunken"}`}
          >
            <span className="w-4 shrink-0 font-mono text-small text-secondary">
              {at + 1}
            </span>
            <span className="flex flex-1 flex-col gap-1">
              <StepText
                text={card.steps[step] ?? ""}
                terms={checked ? [] : terms}
                onTerm={setTerm}
              />
              {wrong && (
                <span className="text-small text-danger">
                  Goes {ordinal(step)}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );

  if (checked) {
    return (
      <>
        <CardBox>
          <FeedbackHeading {...checked} focusRef={headingRef} />
          <Prompt text={promptOf(item)} />
          <h3 className="text-small font-semibold">Your order</h3>
          {order}
          {!checked.right && <Explanation card={card} />}
        </CardBox>
        {after}
      </>
    );
  }

  return (
    <>
      <CardBox>
        <Prompt text={promptOf(item)} focusRef={promptRef} />
        <p className="text-small text-secondary">
          Tap the steps from first to last.
          {terms.length > 0 && " Tap an underlined word to see what it means."}
        </p>
        {placed.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-small font-semibold">Your order</h3>
            {order}
            <button
              type="button"
              onClick={() => setPlaced((list) => list.slice(0, -1))}
              className={`${linkClass} h-control self-start px-5`}
            >
              Undo last step
            </button>
          </div>
        )}
        {!done && (
          <div className="flex flex-col gap-3">
            <h3 className="text-small font-semibold">Still to place</h3>
            <ul className="flex flex-col gap-2">
              {left.map((step) => (
                <li key={step}>
                  <button
                    type="button"
                    onClick={() => setPlaced((list) => [...list, step])}
                    className="focus-ring flex min-h-control w-full items-center border border-accent bg-card px-3 py-3 text-left"
                  >
                    <Markdown text={card.steps[step] ?? ""} inline />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {term && (
          <div className="flex flex-col gap-1 border-t border-border-subtle pt-4">
            <span className="text-small font-semibold text-gold">
              {term.term}
            </span>
            <Markdown text={term.definition} className="text-small" />
          </div>
        )}
      </CardBox>
      <p role="status" className="sr-only">
        {term ? `${term.term}: ${term.definition}` : ""}
      </p>
      <div className="flex justify-end">
        <Button
          type="button"
          waiting={!done || busy}
          onClick={() =>
            done && onCheck(orderingIsRight(placed, card.steps.length))
          }
          className="w-full sm:w-50"
        >
          Check order
        </Button>
      </div>
      {after}
    </>
  );
}
