"use client";

import { type ReactNode, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Markdown } from "@/components/markdown";
import type { MatchingCard as MatchingContent } from "@/lib/content";
import { matchingIsRight, shuffled } from "@/lib/recall-grading";
import { promptOf, type SittingCard } from "@/lib/recall-sitting";
import { CardBox, FeedbackHeading, Lesson, Prompt, useFocusOn } from "./parts";
import type { Checked } from "./sitting-types";

/** One of the heading's matches, such as cost for Costs */
function singular(heading: string) {
  const word = heading.toLowerCase();
  return /[^s]s$/.test(word) ? word.slice(0, -1) : word;
}

function nextEmpty(filled: readonly (string | null)[], after: number) {
  const later = filled.findIndex((match, at) => at > after && match === null);
  return later >= 0 ? later : filled.indexOf(null);
}

/** Fill each box with the match that goes in it */
export function MatchingCard({
  item,
  card,
  focusOnOpen,
  checked,
  onCheck,
  after,
}: {
  item: SittingCard;
  card: MatchingContent;
  focusOnOpen: boolean;
  checked: Checked | null;
  onCheck: (right: boolean) => void;
  after: ReactNode;
}) {
  const answers = card.pairs.map((pair) => pair.match);
  const choices = useMemo(
    () =>
      shuffled(
        [
          ...new Set([
            ...card.pairs.map((p) => p.match),
            ...(card.extraMatches ?? []),
          ]),
        ],
        `${item.key}:${item.session.dueAt}`,
      ),
    [card.pairs, card.extraMatches, item.key, item.session.dueAt],
  );
  const [filled, setFilled] = useState<(string | null)[]>(() =>
    card.pairs.map(() => null),
  );
  const [selected, setSelected] = useState<number | null>(0);
  const promptRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const base = useId();
  const choicesId = `${base}-choices`;

  useFocusOn(promptRef, item.key, focusOnOpen);
  useFocusOn(headingRef, checked !== null, false);

  function tapBox(at: number) {
    if (selected === at && filled[at] !== null) {
      setFilled((list) => list.map((match, i) => (i === at ? null : match)));
      return;
    }
    setSelected(at);
  }

  function tapChoice(choice: string) {
    const at = selected ?? filled.indexOf(null);
    if (at < 0) return;
    const next = filled.map((match, i) => (i === at ? choice : match));
    setFilled(next);
    const empty = nextEmpty(next, at);
    setSelected(empty >= 0 ? empty : null);
  }

  const complete = filled.every((match) => match !== null);

  if (checked) {
    return (
      <>
        <CardBox>
          <FeedbackHeading {...checked} focusRef={headingRef} />
          <Prompt text={promptOf(item)} />
          <ul className="flex flex-col gap-4">
            {card.pairs.map((pair, at) => {
              const wrong = filled[at] !== pair.match;
              return (
                <li key={pair.item} className="flex flex-col gap-2">
                  <Markdown text={pair.item} className="font-semibold" />
                  <div
                    className={`flex flex-col gap-1 p-3 ${wrong ? "border border-danger" : "bg-sunken"}`}
                  >
                    <Markdown text={filled[at] ?? ""} inline />
                    {wrong && (
                      <span className="text-small text-danger">
                        It's <Markdown text={pair.match} inline />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {!checked.right && <Lesson card={card} missed />}
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
          Tap a box, then the {singular(card.matchHeading)} that goes in it.
        </p>
        <ul className="flex flex-col gap-4">
          {card.pairs.map((pair, at) => {
            const match = filled[at] ?? null;
            const isSelected = selected === at;
            const itemId = `${base}-item-${at}`;
            const look =
              match !== null
                ? `bg-sunken ${isSelected ? "border-2 border-accent" : "border border-transparent"}`
                : isSelected
                  ? "border-2 border-accent bg-card"
                  : "border border-dashed border-accent bg-card";
            return (
              <li key={pair.item} className="flex flex-col gap-2">
                <div id={itemId} className="font-semibold">
                  <Markdown text={pair.item} inline />
                </div>
                <button
                  type="button"
                  aria-describedby={itemId}
                  aria-pressed={isSelected}
                  aria-controls={choicesId}
                  onClick={() => tapBox(at)}
                  className={`focus-ring flex min-h-control items-center px-3 text-left ${look}`}
                >
                  {match !== null ? (
                    <Markdown text={match} inline />
                  ) : (
                    <span className="text-small text-secondary">
                      {isSelected
                        ? `Now pick a ${singular(card.matchHeading)}`
                        : "Tap to fill"}
                    </span>
                  )}
                </button>
                {isSelected && match !== null && (
                  <p className="text-small text-secondary">
                    Pick a new {singular(card.matchHeading)}, or tap the box
                    again to clear it.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <fieldset id={choicesId} className="flex flex-col gap-3">
          <legend className="mb-3 text-label uppercase text-secondary">
            {card.matchHeading}
          </legend>
          <div className="flex flex-wrap gap-2">
            {choices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => tapChoice(choice)}
                className="focus-ring flex min-h-control items-center border border-accent bg-card px-3"
              >
                <Markdown text={choice} inline />
              </button>
            ))}
          </div>
        </fieldset>
      </CardBox>
      <div className="flex justify-end">
        <Button
          type="button"
          waiting={!complete}
          onClick={() => complete && onCheck(matchingIsRight(filled, answers))}
          className="w-full sm:w-50"
        >
          Check matches
        </Button>
      </div>
      {after}
    </>
  );
}
