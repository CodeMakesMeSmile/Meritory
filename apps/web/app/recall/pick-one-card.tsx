"use client";

import { promptOf, type SittingCard, shuffled } from "@meritory/recall-client";
import { type ReactNode, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Markdown } from "@/components/markdown";
import type { PickOneCard as PickOneContent } from "@/lib/content";
import {
  answerRule,
  CardBox,
  FeedbackHeading,
  Lesson,
  Prompt,
  useFocusOn,
} from "./parts";
import type { Checked } from "./sitting-types";

type Option = PickOneContent["options"][number];

function Choice({
  option,
  label,
  missed,
}: {
  option: Option;
  label: string;
  missed: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 p-3 ${answerRule(missed)}`}>
      <h3
        className={`text-small font-semibold ${missed ? "text-danger" : "text-success"}`}
      >
        {label}
      </h3>
      <Markdown text={option.text} inline />
      <Markdown
        text={option.reason}
        inline
        className="text-small text-secondary"
      />
    </div>
  );
}

/** Pick the one right answer from a few */
export function PickOneCard({
  item,
  card,
  focusOnOpen,
  checked,
  onCheck,
  busy,
  after,
}: {
  item: SittingCard;
  card: PickOneContent;
  focusOnOpen: boolean;
  checked: Checked | null;
  onCheck: (right: boolean) => void;
  /** Another save or Undo is still on its way */
  busy: boolean;
  after: ReactNode;
}) {
  const options = useMemo(
    () => shuffled(card.options, `${item.key}:${item.session.dueAt}`),
    [card.options, item.key, item.session.dueAt],
  );
  const [picked, setPicked] = useState<number | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const name = useId();
  const legendId = useId();

  useFocusOn(promptRef, item.key, focusOnOpen);
  useFocusOn(headingRef, checked !== null, false);

  const pick = picked === null ? null : options[picked];
  const answer = options.find((option) => option.correct);

  if (checked && pick) {
    return (
      <>
        <CardBox>
          <FeedbackHeading
            {...checked}
            focusRef={headingRef}
            showWait={false}
          />
          <Prompt text={promptOf(item)} answered />
          <Choice option={pick} label="Your pick" missed={!checked.right} />
          {!checked.right && answer && (
            <div className={`flex flex-col gap-1 p-3 ${answerRule(false)}`}>
              <h3 className="text-small font-semibold text-success">
                Here's the answer
              </h3>
              <Markdown text={answer.text} inline />
              <Markdown
                text={answer.reason}
                inline
                className="text-small text-secondary"
              />
            </div>
          )}
          <Lesson card={card} missed={!checked.right} wait={checked.wait} />
        </CardBox>
        {after}
      </>
    );
  }

  return (
    <>
      <CardBox>
        <Prompt text={promptOf(item)} focusRef={promptRef} />
        <fieldset aria-labelledby={legendId} className="flex flex-col gap-2">
          <legend id={legendId} className="mb-2 text-small font-semibold">
            Pick one
          </legend>
          {options.map((option, at) => (
            <label
              key={option.text}
              className={`flex min-h-control cursor-pointer items-center gap-3 border px-3 py-2 has-focus-visible:shadow-(--focus-ring) ${
                picked === at ? "border-accent bg-sunken" : "border-border"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={picked === at}
                onChange={() => setPicked(at)}
                className="size-4 shrink-0 accent-(--color-accent-default)"
              />
              <Markdown text={option.text} inline />
            </label>
          ))}
        </fieldset>
      </CardBox>
      <div className="flex justify-end">
        <Button
          type="button"
          waiting={pick === null || busy}
          onClick={() => pick && onCheck(pick.correct === true)}
          className="w-full sm:w-50"
        >
          Check answer
        </Button>
      </div>
      {after}
    </>
  );
}
