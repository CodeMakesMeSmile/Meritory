"use client";

import { type RefObject, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Markdown } from "@/components/markdown";
import { shortDate } from "@/lib/activity";
import {
  clock,
  MAX_ANSWER,
  type Rubric,
  scoreResult,
  selfCriteria,
  wordCount,
} from "@/lib/practice";
import {
  type Debrief,
  debriefBar,
  debriefCriteria,
  editAnswer,
  isLocked,
  lockRun,
  minutesText,
  NO_REHEARSALS,
  type Rehearsals,
  readRehearsals,
  recordResult,
  type Stage,
  secondsLeft,
  secondsUsed,
  setDebrief,
  stageOf,
  startRun,
  timedOut,
  timeMark,
  writeRehearsals,
} from "@/lib/rehearsal";
import { ScoreCriteria } from "./score-criteria";

const SHOWN_PAST = 5;

const DEBRIEF_OPTIONS: { value: Debrief; label: string }[] = [
  { value: "unknown", label: "I didn't know it" },
  { value: "froze", label: "I knew it but froze" },
];

function focusSoon(ref: RefObject<HTMLElement | null>) {
  // After the next stage renders
  window.setTimeout(() => ref.current?.focus(), 0);
}

/** A timed run at the exercise, kept apart from everyday practice */
export function Rehearsal({
  trackId,
  exerciseId,
  version,
  minutes,
  rubric,
  requires,
  answer,
}: {
  trackId: string;
  exerciseId: string;
  version: number;
  minutes: number;
  rubric: Rubric;
  requires: string[];
  answer: string;
}) {
  const [rehearsals, setRehearsals] = useState<Rehearsals>(NO_REHEARSALS);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  // Seconds left at the last tick, null until a run is on this page
  const lastLeft = useRef<number | null>(null);
  const startRef = useRef<HTMLHeadingElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const lockedRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setRehearsals(readRehearsals(trackId, exerciseId, version));
    setNow(Date.now());
    setLoaded(true);
  }, [trackId, exerciseId, version]);

  useEffect(() => {
    if (loaded) writeRehearsals(trackId, exerciseId, version, rehearsals);
  }, [loaded, trackId, exerciseId, version, rehearsals]);

  const run = rehearsals.current;
  const stage = stageOf(rehearsals, now);
  const running = stage === "running";

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!loaded || !run || run.lockedAt !== null) return;
    if (isLocked(run, now)) {
      setRehearsals((s) =>
        s.current ? { ...s, current: lockRun(s.current, now) } : s,
      );
      // Only when the clock ran out here, not on a later visit
      if (lastLeft.current !== null) focusSoon(lockedRef);
      lastLeft.current = null;
      return;
    }
    const left = secondsLeft(run, now);
    const before = lastLeft.current;
    lastLeft.current = left;
    const mark = before === null ? null : timeMark(before, left, minutes * 60);
    if (mark) setAnnouncement(`${minutesText(mark)} left.`);
  }, [loaded, run, now, minutes]);

  function start() {
    const at = Date.now();
    setNow(at);
    lastLeft.current = minutes * 60;
    setRehearsals((s) => ({ ...s, current: startRun(minutes, at) }));
    setAnnouncement(`Rehearsal started. ${minutesText(minutes)} left.`);
    focusSoon(answerRef);
  }

  function finish() {
    const at = Date.now();
    setNow(at);
    lastLeft.current = null;
    setRehearsals((s) =>
      s.current ? { ...s, current: lockRun(s.current, at) } : s,
    );
    focusSoon(lockedRef);
  }

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <RehearsalStage
        stage={stage}
        rehearsals={rehearsals}
        now={now}
        minutes={minutes}
        rubric={rubric}
        requires={requires}
        answer={answer}
        refs={{ startRef, answerRef, lockedRef, resultRef }}
        onStart={start}
        onEdit={(text) => {
          const at = Date.now();
          setRehearsals((s) =>
            s.current ? { ...s, current: editAnswer(s.current, text, at) } : s,
          );
        }}
        onFinish={finish}
        onPick={(id, level) =>
          setRehearsals((s) =>
            s.current && !s.current.scored
              ? {
                  ...s,
                  current: {
                    ...s.current,
                    scores: { ...s.current.scores, [id]: level },
                  },
                }
              : s,
          )
        }
        onShowResult={() => {
          setRehearsals((s) =>
            s.current
              ? recordResult(s, scoreResult(rubric, requires, s.current.scores))
              : s,
          );
          focusSoon(resultRef);
        }}
        onDebrief={(id, value) =>
          setRehearsals((s) => setDebrief(s, id, value))
        }
        onBack={() => {
          setRehearsals((s) => ({ ...s, current: null }));
          setAnnouncement("");
          focusSoon(startRef);
        }}
      />
    </>
  );
}

interface StageProps {
  stage: Stage;
  rehearsals: Rehearsals;
  now: number;
  minutes: number;
  rubric: Rubric;
  requires: string[];
  answer: string;
  refs?: {
    startRef: RefObject<HTMLHeadingElement | null>;
    answerRef: RefObject<HTMLTextAreaElement | null>;
    lockedRef: RefObject<HTMLHeadingElement | null>;
    resultRef: RefObject<HTMLHeadingElement | null>;
  };
  onStart: () => void;
  onEdit: (text: string) => void;
  onFinish: () => void;
  onPick: (criterionId: string, level: number) => void;
  onShowResult: () => void;
  onDebrief: (criterionId: string, value: Debrief) => void;
  onBack: () => void;
}

/** What each stage shows, kept apart from the clock so it can be tested */
export function RehearsalStage(props: StageProps) {
  const { stage, rehearsals, now, minutes, rubric, requires, refs } = props;
  const id = useId();
  const run = rehearsals.current;

  if (stage === "start" || !run) {
    return (
      <div className="flex flex-col gap-8">
        <section
          aria-labelledby={`${id}-start`}
          className="flex flex-col gap-3"
        >
          <h2
            id={`${id}-start`}
            ref={refs?.startRef}
            tabIndex={-1}
            className="text-h2 focus:outline-none"
          >
            Rehearse in {minutesText(minutes)}
          </h2>
          <p>
            One go, with no hints, and the clock keeps running like it would in
            the room. When time's up, your answer locks. Then you score it
            against the rubric and see the model answer.
          </p>
          <p className="text-small text-secondary">
            Rehearsals are saved in this browser only, apart from your practice
            answer.
          </p>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={props.onStart}
              className="w-full sm:w-50"
            >
              Start rehearsal
            </Button>
          </div>
        </section>
        <PastRehearsals rehearsals={rehearsals} now={now} />
      </div>
    );
  }

  const locked = stage !== "running";
  const left = secondsLeft(run, now);
  const outOfTime = locked && (timedOut(run) || run.lockedAt === null);
  const criteria = selfCriteria(rubric);
  const allScored = criteria.every((c) => run.scores[c.id] !== undefined);

  let heading = "Your answer";
  let hint =
    "Your answer locks when the clock reaches 0:00. You can finish early.";
  if (stage === "locked") {
    heading = outOfTime ? "Time's up" : `Finished with ${clock(left)} to spare`;
    hint =
      "Your answer is locked, so score what's on the page, not what you meant to add.";
  } else if (stage === "done") {
    const used = clock(secondsUsed(run, now));
    hint = outOfTime
      ? `Locked when time ran out, after ${used}.`
      : `Locked when you finished, after ${used}.`;
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby={`${id}-answer`} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id={`${id}-answer`}
            ref={stage === "locked" ? refs?.lockedRef : undefined}
            tabIndex={-1}
            className="text-h2 focus:outline-none"
          >
            {heading}
          </h2>
          {(stage === "running" || (stage === "locked" && outOfTime)) && (
            <p role="timer" className="flex items-baseline gap-2">
              <span className="font-mono text-body">{clock(left)}</span>
              {stage === "running" && (
                <span className="text-small text-secondary">left</span>
              )}
            </p>
          )}
        </div>
        <p id={`${id}-hint`} className="text-small text-secondary">
          {hint}
        </p>
        <textarea
          ref={refs?.answerRef}
          aria-labelledby={`${id}-answer`}
          aria-describedby={`${id}-hint ${id}-words`}
          value={run.answer}
          readOnly={locked}
          maxLength={MAX_ANSWER}
          onChange={(event) => {
            if (!locked) props.onEdit(event.target.value);
          }}
          rows={14}
          className={`focus-ring min-h-60 resize-y border border-border p-3 text-body ${
            locked ? "bg-sunken" : "bg-card"
          }`}
        />
        <p id={`${id}-words`} className="text-small text-secondary">
          {wordCount(run.answer)} words
        </p>
        {stage === "running" && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={props.onFinish}
              className="w-full sm:w-50"
            >
              Finish early
            </Button>
          </div>
        )}
      </section>

      {stage === "locked" && (
        <section
          aria-labelledby={`${id}-score`}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h2 id={`${id}-score`} className="text-h2">
              Score yourself
            </h2>
            <p className="text-small text-secondary">
              Pick a level for each criterion. The model answer shows after
              this.
            </p>
          </div>
          <ScoreCriteria
            idPrefix={id}
            criteria={criteria}
            requires={requires}
            scores={run.scores}
            onPick={props.onPick}
          />
          <div className="flex flex-col items-end gap-2">
            <Button
              type="button"
              waiting={!allScored}
              onClick={() => allScored && props.onShowResult()}
              className="w-full sm:w-50"
            >
              Show my result
            </Button>
            {!allScored && (
              <p className="text-small text-secondary">
                Pick a level for each of the {criteria.length} criteria.
              </p>
            )}
          </div>
        </section>
      )}

      {stage === "done" && <Debriefing {...props} />}
    </div>
  );
}

function Debriefing(props: StageProps) {
  const { rehearsals, rubric, requires, answer, refs } = props;
  const id = useId();
  const run = rehearsals.current;
  if (!run) return null;
  const result = scoreResult(rubric, requires, run.scores);
  const toAsk = debriefCriteria(rubric, run.scores);

  return (
    <>
      <section
        aria-labelledby={`${id}-result`}
        className="flex flex-col gap-2 border-t border-border pt-6"
      >
        <h2
          id={`${id}-result`}
          ref={refs?.resultRef}
          tabIndex={-1}
          className="text-h2 focus:outline-none"
        >
          {result.passed ? "That's a pass" : "Not a pass yet"}
        </h2>
        <p>
          You scored {result.total} of {result.max}. It passes at{" "}
          {rubric.pass.total}, with no criterion below {rubric.pass.lowest}
          {requires.length > 0 ? " and the required ones at 3 or more" : ""}.
        </p>
        {result.short.length > 0 && (
          <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-secondary">
            {result.short.map((c) => (
              <li key={c.id}>
                {c.name} needs level {c.needs} or more.
              </li>
            ))}
          </ul>
        )}
      </section>

      {toAsk.length > 0 && (
        <section
          aria-labelledby={`${id}-debrief`}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h2 id={`${id}-debrief`} className="text-h2">
              What got in the way?
            </h2>
            <p className="text-small text-secondary">
              For each criterion under level {debriefBar(rubric)}, pick what
              happened. Didn't know it means it's one to study in the chapter.
              Froze means it's one to rehearse again.
            </p>
          </div>
          {toAsk.map((criterion) => (
            <fieldset key={criterion.id} className="flex flex-col gap-2">
              <legend className="mb-2 text-body font-semibold">
                {criterion.name}, level {criterion.level}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {DEBRIEF_OPTIONS.map((option) => {
                  const picked = run.debrief[criterion.id] === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex min-h-control cursor-pointer items-center gap-3 border px-3 py-3 has-focus-visible:shadow-(--focus-ring) ${
                        picked ? "border-accent bg-sunken" : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${id}-${criterion.id}`}
                        value={option.value}
                        checked={picked}
                        onChange={() =>
                          props.onDebrief(criterion.id, option.value)
                        }
                        className="size-4 shrink-0 accent-(--color-accent-default)"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </section>
      )}

      <section aria-labelledby={`${id}-model`} className="flex flex-col gap-3">
        <h2 id={`${id}-model`} className="text-h2">
          Model answer
        </h2>
        <div className="border border-border bg-card p-5 md:p-8">
          <Markdown text={answer} />
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={props.onBack}
          className="w-full sm:w-50"
        >
          Back to rehearsals
        </Button>
      </div>
    </>
  );
}

function PastRehearsals({
  rehearsals,
  now,
}: {
  rehearsals: Rehearsals;
  now: number;
}) {
  const id = useId();
  const shown = rehearsals.past.slice(0, SHOWN_PAST);
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="text-h3">
        Past rehearsals
      </h3>
      {shown.length === 0 ? (
        <p className="text-small text-secondary">
          None yet. Your score and result show here after each rehearsal.
        </p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-small text-secondary">
              <th scope="col" className="h-control w-2/7 font-normal">
                Date
              </th>
              <th scope="col" className="h-control w-2/7 font-normal">
                Score
              </th>
              <th scope="col" className="h-control font-normal">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((past) => (
              <tr key={past.startedAt} className="border-b border-border">
                <td className="h-control">
                  {shortDate(new Date(past.startedAt), new Date(now))}
                </td>
                <td className="h-control">
                  {past.total} of {past.max}
                </td>
                <td className="h-control">
                  {past.passed ? "Pass" : "Not a pass yet"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
