"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Markdown } from "@/components/markdown";
import {
  clock,
  type Draft,
  EMPTY_DRAFT,
  MAX_ANSWER,
  type Rubric,
  readDraft,
  scoreResult,
  selfCriteria,
  wordCount,
  writeDraft,
} from "@/lib/practice";
import { ScoreCriteria } from "./score-criteria";

type Stage = "writing" | "scoring" | "done";

/** Write an answer, score it against the rubric, then compare with ours */
export function DesignPractice({
  trackId,
  exerciseId,
  version,
  rubric,
  requires,
  answer,
}: {
  trackId: string;
  exerciseId: string;
  version: number;
  rubric: Rubric;
  requires: string[];
  answer: string;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const [stage, setStage] = useState<Stage>("writing");
  const [running, setRunning] = useState(false);
  const [clearing, setClearing] = useState(false);
  const scoringRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const answerId = useId();
  const hintId = useId();
  const criteria = selfCriteria(rubric);

  useEffect(() => {
    const saved = readDraft(trackId, exerciseId, version);
    setDraft(saved);
    setStage(saved.scored ? "done" : "writing");
    setLoaded(true);
  }, [trackId, exerciseId, version]);

  useEffect(() => {
    if (loaded) writeDraft(trackId, exerciseId, version, draft);
  }, [loaded, trackId, exerciseId, version, draft]);

  useEffect(() => {
    if (!running) return;
    // Counted from the clock, since a hidden tab slows its timers
    const startedAt = Date.now();
    let counted = 0;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const more = elapsed - counted;
      if (more <= 0) return;
      counted = elapsed;
      setDraft((d) => ({ ...d, seconds: d.seconds + more }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function moveTo(next: Stage) {
    setStage(next);
    // After the new section renders
    window.setTimeout(() => {
      (next === "done" ? resultRef : scoringRef).current?.focus();
    }, 0);
  }

  const written = draft.answer.trim().length > 0;
  const allScored = criteria.every((c) => draft.scores[c.id] !== undefined);
  const result = scoreResult(rubric, requires, draft.scores);

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby={`${answerId}-heading`}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${answerId}-heading`} className="text-h2">
            Your answer
          </h2>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-body"
              role="timer"
              aria-label={`Time spent ${clock(draft.seconds)}`}
            >
              {clock(draft.seconds)}
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRunning((on) => !on)}
              className="min-w-32 whitespace-nowrap"
            >
              {running ? "Pause" : draft.seconds > 0 ? "Resume" : "Start timer"}
            </Button>
          </div>
        </div>
        <label htmlFor={answerId} className="text-small text-secondary">
          Write it the way you'd talk it through: what you'd ask, the numbers,
          the design, and what you'd trade off. It's saved in this browser only.
        </label>
        <textarea
          id={answerId}
          aria-describedby={hintId}
          value={draft.answer}
          maxLength={MAX_ANSWER}
          onChange={(event) => {
            const value = event.target.value;
            setDraft((d) => ({ ...d, answer: value }));
          }}
          rows={14}
          className="focus-ring min-h-60 resize-y border border-border bg-card p-3 text-body"
        />
        <p id={hintId} className="text-small text-secondary">
          {wordCount(draft.answer)} words
        </p>
        {stage === "writing" && (
          <div className="flex justify-end">
            <Button
              type="button"
              waiting={!written}
              onClick={() => written && moveTo("scoring")}
              className="w-full sm:w-60"
            >
              Score my answer
            </Button>
          </div>
        )}
        {stage === "writing" && !written && (
          <p className="text-small text-secondary sm:text-right">
            Write something first. A rough outline is enough.
          </p>
        )}
      </section>

      {stage !== "writing" && (
        <section
          aria-labelledby={`${answerId}-score`}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h2
              id={`${answerId}-score`}
              ref={scoringRef}
              tabIndex={-1}
              className="text-h2 focus:outline-none"
            >
              Score yourself
            </h2>
            <p className="text-small text-secondary">
              Pick the level that matches what you wrote, not what you meant.
              The model answer shows after this.
            </p>
          </div>
          <ScoreCriteria
            idPrefix={answerId}
            criteria={criteria}
            requires={requires}
            scores={draft.scores}
            onPick={(id, value) =>
              setDraft((d) => ({ ...d, scores: { ...d.scores, [id]: value } }))
            }
          />
          {stage === "scoring" && (
            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                waiting={!allScored}
                onClick={() => {
                  if (!allScored) return;
                  setRunning(false);
                  setDraft((d) => ({ ...d, scored: true }));
                  moveTo("done");
                }}
                className="w-full sm:w-60"
              >
                Show my result
              </Button>
              {!allScored && (
                <p className="text-small text-secondary">
                  Pick a level for each of the {criteria.length} criteria.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {stage === "done" && (
        <section
          aria-labelledby={`${answerId}-result`}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2 border-t border-border pt-6">
            <h2
              id={`${answerId}-result`}
              ref={resultRef}
              tabIndex={-1}
              className="text-h2 focus:outline-none"
            >
              {result.passed ? "That's a pass" : "Not a pass yet"}
            </h2>
            <p>
              You scored {result.total} of {result.max}. It passes at{" "}
              {rubric.pass.total}, with no criterion below {rubric.pass.lowest}
              {requires.length > 0 ? " and the required ones at 3 or more" : ""}
              .
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
            {!result.passed && (
              <p className="text-small text-secondary">
                Compare with the model answer below, then try the sibling
                exercise or this one again tomorrow.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-h2">Model answer</h2>
            <div className="border border-border bg-card p-5 md:p-8">
              <Markdown text={answer} />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            {clearing ? (
              <>
                <p className="w-full text-right text-small">
                  Clear your answer, scores, and time? This can't be undone.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setClearing(false)}
                  className="w-full sm:w-40"
                >
                  Keep it
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setClearing(false);
                    setRunning(false);
                    setDraft(EMPTY_DRAFT);
                    setStage("writing");
                  }}
                  className="w-full sm:w-40"
                >
                  Clear it
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDraft((d) => ({ ...d, scored: false }));
                    moveTo("scoring");
                  }}
                  className="w-full sm:w-50"
                >
                  Change my scores
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setClearing(true)}
                  className="w-full sm:w-50"
                >
                  Start again
                </Button>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
