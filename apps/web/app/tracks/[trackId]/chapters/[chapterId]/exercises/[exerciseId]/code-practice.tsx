"use client";

import type { CodeLanguage, CodeRunResponse } from "@meritory/contracts";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { CountSquares } from "@/components/count-squares";
import {
  type CodingExercise,
  LANGUAGE_NAMES,
  readCode,
  readLanguage,
  runCode,
  runCounter,
  runProblem,
  starterCode,
  summary,
  writeCode,
  writeLanguage,
} from "@/lib/code";

const LANGUAGES = Object.keys(LANGUAGE_NAMES) as CodeLanguage[];
const INDENT: Record<CodeLanguage, string> = {
  typescript: "  ",
  python: "    ",
};
const MAX_CODE = 65536;

const STATUS = {
  pass: { label: "Passed", className: "text-success" },
  fail: { label: "Failed", className: "text-danger" },
  error: { label: "Error", className: "text-danger" },
} as const;

/** Write an answer in the browser, then check it against the exercise's cases */
export function CodePractice({
  trackId,
  chapterId,
  exerciseId,
  signature,
}: {
  trackId: string;
  chapterId: string;
  exerciseId: string;
  signature: CodingExercise["signature"];
}) {
  const [language, setLanguage] = useState<CodeLanguage>("typescript");
  const [code, setCode] = useState(() => starterCode(signature, "typescript"));
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeRunResponse | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [runs] = useState(runCounter);
  const leaving = useRef(false);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  useEffect(() => {
    // A run for the exercise before this one isn't about this code
    runs.cancel();
    setRunning(false);
    setResult(null);
    setProblem(null);
    const saved = readLanguage();
    setLanguage(saved);
    setCode(
      readCode(trackId, exerciseId, saved) ?? starterCode(signature, saved),
    );
    setLoaded(true);
  }, [runs, trackId, exerciseId, signature]);

  useEffect(() => {
    if (!loaded) return;
    // Untouched starter code isn't worth keeping
    const fresh = code === starterCode(signature, language);
    writeCode(trackId, exerciseId, language, fresh ? null : code);
  }, [loaded, trackId, exerciseId, language, signature, code]);

  function pickLanguage(next: CodeLanguage) {
    runs.cancel();
    setRunning(false);
    setLanguage(next);
    writeLanguage(next);
    setCode(
      readCode(trackId, exerciseId, next) ?? starterCode(signature, next),
    );
    setResult(null);
    setProblem(null);
    setConfirmReset(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      leaving.current = true;
      return;
    }
    if (event.key !== "Tab" || leaving.current) {
      leaving.current = false;
      return;
    }
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
      return;
    event.preventDefault();
    const editor = event.currentTarget;
    const indent = INDENT[language];
    // insertText keeps the browser's undo history
    if (!document.execCommand("insertText", false, indent)) {
      const { selectionStart: start, selectionEnd: end, value } = editor;
      const next = value.slice(0, start) + indent + value.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        editor.selectionStart = editor.selectionEnd = start + indent.length;
      });
    }
  }

  async function run() {
    if (running) return;
    const current = runs.start();
    setRunning(true);
    setProblem(null);
    setResult(null);
    const outcome = await runCode({
      trackId,
      chapterId,
      exerciseId,
      language,
      code,
    });
    if (!runs.isLatest(current)) return;
    setRunning(false);
    if (outcome.ok) {
      setResult(outcome.result);
      // After the results render
      window.setTimeout(() => resultRef.current?.focus(), 0);
    } else {
      setProblem(runProblem(outcome));
    }
  }

  function reset() {
    runs.cancel();
    setRunning(false);
    writeCode(trackId, exerciseId, language, null);
    setCode(starterCode(signature, language));
    setResult(null);
    setProblem(null);
    setConfirmReset(false);
    editorRef.current?.focus();
  }

  const passed = result?.tests.filter((t) => t.status === "pass").length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby={`${id}-heading`}
        className="flex flex-col gap-3"
      >
        <h2 id={`${id}-heading`} className="text-h2">
          Your answer
        </h2>
        <fieldset disabled={running} className="flex flex-wrap gap-3">
          <legend className="mb-2 text-small text-secondary">Language</legend>
          {LANGUAGES.map((option) => (
            <label
              key={option}
              className={`flex h-control cursor-pointer items-center has-disabled:cursor-progress has-disabled:text-secondary gap-3 border px-4 has-focus-visible:shadow-(--focus-ring) ${
                language === option
                  ? "border-accent bg-sunken"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name={`${id}-language`}
                checked={language === option}
                onChange={() => pickLanguage(option)}
                className="size-4 shrink-0 accent-(--color-accent-default)"
              />
              <span className="text-body">{LANGUAGE_NAMES[option]}</span>
            </label>
          ))}
        </fieldset>
        <label htmlFor={`${id}-code`} className="text-small text-secondary">
          Fill in the {LANGUAGE_NAMES[language]} below. It's saved in this
          browser only.
        </label>
        <textarea
          id={`${id}-code`}
          ref={editorRef}
          aria-describedby={`${id}-keys`}
          value={code}
          maxLength={MAX_CODE}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          wrap="off"
          onKeyDown={onKeyDown}
          onChange={(event) => setCode(event.target.value)}
          rows={16}
          className="focus-ring min-h-80 resize-y border border-border bg-card p-3 font-mono text-small"
        />
        <p id={`${id}-keys`} className="text-small text-secondary">
          Tab indents. To leave the box, press Esc, then Tab.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {confirmReset ? (
            <>
              <span className="text-small">
                Start over from the empty code?
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmReset(false)}
              >
                Keep my code
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={running}
                onClick={reset}
              >
                Start over
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={running}
              onClick={() => setConfirmReset(true)}
            >
              Start over
            </Button>
          )}
          <Button
            type="button"
            onClick={run}
            disabled={running}
            className="w-full sm:w-48"
          >
            {running ? "Running tests" : "Run tests"}
          </Button>
        </div>
        {problem && <Alert tone="danger">{problem}</Alert>}
      </section>

      {result && (
        <section
          aria-labelledby={`${id}-result`}
          className="flex flex-col gap-4"
        >
          <h2
            id={`${id}-result`}
            ref={resultRef}
            tabIndex={-1}
            className="text-h2 focus:outline-none"
          >
            {summary(result)}
          </h2>
          {result.tests.length > 0 && (
            <CountSquares filled={passed} total={result.tests.length} />
          )}
          {result.message && (
            <pre className="overflow-x-auto border border-danger bg-card p-3 font-mono text-small whitespace-pre-wrap">
              {result.message}
            </pre>
          )}
          {result.tests.length > 0 && (
            <ol className="flex flex-col border-t border-border">
              {result.tests.map((test) => (
                <li
                  key={test.name}
                  className="grid grid-cols-[4rem_1fr] items-baseline gap-x-3 gap-y-1 border-b border-border py-3"
                >
                  <span
                    className={`text-small font-semibold ${STATUS[test.status].className}`}
                  >
                    {STATUS[test.status].label}
                  </span>
                  <span className="text-body">{test.name}</span>
                  {test.message && (
                    <pre className="col-start-2 overflow-x-auto font-mono text-small whitespace-pre-wrap text-secondary">
                      {test.message}
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          )}
          {result.status === "pass" && (
            <p className="text-body">
              Nice work. Try the sibling exercise next, or come back in a few
              days and solve this one again from memory.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
