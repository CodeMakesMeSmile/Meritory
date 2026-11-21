import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Rubric, readDraft, scoreResult, writeDraft } from "./practice";
import {
  debriefCriteria,
  editAnswer,
  isLocked,
  lockRun,
  MAX_PAST,
  NO_REHEARSALS,
  type Rehearsals,
  readRehearsals,
  recordResult,
  rehearsalMinutes,
  secondsLeft,
  secondsUsed,
  setDebrief,
  startRun,
  timedOut,
  timeMark,
  writeRehearsals,
} from "./rehearsal";

const store = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
vi.stubGlobal("window", { localStorage });

const levels = ["One", "Two", "Three", "Four"];

const rubric = {
  id: "design-review",
  title: "Design review",
  criteria: [
    { id: "requirements", name: "Requirements", scoredBy: "self", levels },
    { id: "trade-offs", name: "Trade-offs", scoredBy: "self", levels },
    { id: "estimates", name: "Estimates", scoredBy: "self", levels },
  ],
  pass: { total: 9, lowest: 2 },
  hash: "h",
  version: 1,
} as Rubric;

const T0 = Date.UTC(2026, 10, 20, 15, 0, 0);
const MINUTE = 60_000;

describe("rehearsalMinutes", () => {
  it("gives a design case 45 minutes and a story 5", () => {
    expect(rehearsalMinutes("design-review")).toBe(45);
    expect(rehearsalMinutes("story-review")).toBe(5);
  });

  it("has no rehearsal for other rubrics", () => {
    expect(rehearsalMinutes("coding-practice")).toBeNull();
    expect(rehearsalMinutes("toString")).toBeNull();
  });
});

describe("the countdown", () => {
  it("counts down from the full length", () => {
    const run = startRun(45, T0);
    expect(secondsLeft(run, T0)).toBe(45 * 60);
    expect(secondsLeft(run, T0 + 1)).toBe(45 * 60);
    expect(secondsLeft(run, T0 + 10 * MINUTE)).toBe(35 * 60);
    expect(secondsLeft(run, T0 + 99 * MINUTE)).toBe(0);
  });

  it("locks at zero, even if nothing locked it yet", () => {
    const run = startRun(5, T0);
    expect(isLocked(run, T0 + 5 * MINUTE - 1)).toBe(false);
    expect(isLocked(run, T0 + 5 * MINUTE)).toBe(true);
  });

  it("won't change the answer once it's locked", () => {
    let run = startRun(5, T0);
    run = editAnswer(run, "First draft", T0 + MINUTE);
    expect(run.answer).toBe("First draft");
    expect(editAnswer(run, "Too late", T0 + 5 * MINUTE).answer).toBe(
      "First draft",
    );
    const early = lockRun(run, T0 + 2 * MINUTE);
    expect(editAnswer(early, "After finishing", T0 + 3 * MINUTE).answer).toBe(
      "First draft",
    );
  });

  it("locks at the deadline when it's noticed late", () => {
    const run = lockRun(startRun(5, T0), T0 + 60 * MINUTE);
    expect(run.lockedAt).toBe(T0 + 5 * MINUTE);
    expect(timedOut(run)).toBe(true);
    expect(secondsUsed(run, T0 + 60 * MINUTE)).toBe(5 * 60);
  });

  it("keeps the time left when finished early", () => {
    const run = lockRun(startRun(45, T0), T0 + 30 * MINUTE);
    expect(timedOut(run)).toBe(false);
    expect(secondsLeft(run, T0 + 40 * MINUTE)).toBe(15 * 60);
    expect(secondsUsed(run, T0 + 40 * MINUTE)).toBe(30 * 60);
    expect(lockRun(run, T0 + 40 * MINUTE)).toBe(run);
  });
});

describe("timeMark", () => {
  it("announces a mark once, as the clock passes it", () => {
    const total = 45 * 60;
    expect(timeMark(30 * 60 + 1, 30 * 60, total)).toBe(30);
    expect(timeMark(30 * 60, 30 * 60 - 1, total)).toBeNull();
    expect(timeMark(301, 300, total)).toBe(5);
    expect(timeMark(61, 60, total)).toBe(1);
    expect(timeMark(200, 199, total)).toBeNull();
  });

  it("skips marks at the full length", () => {
    expect(timeMark(301, 300, 300)).toBeNull();
    expect(timeMark(61, 60, 300)).toBe(1);
  });

  it("names only the latest mark after a long gap", () => {
    expect(timeMark(20 * 60, 30, 45 * 60)).toBe(1);
  });
});

describe("results and debrief", () => {
  const locked = (scores: Record<string, number>): Rehearsals => ({
    current: { ...lockRun(startRun(45, T0), T0 + 45 * MINUTE), scores },
    past: [],
  });

  it("asks about criteria under level 3", () => {
    expect(
      debriefCriteria(rubric, {
        requirements: 3,
        "trade-offs": 1,
        estimates: 2,
      }),
    ).toEqual([
      { id: "trade-offs", name: "Trade-offs", level: 1 },
      { id: "estimates", name: "Estimates", level: 2 },
    ]);
  });

  it("keeps the result with the past rehearsals, newest first", () => {
    const scores = { requirements: 4, "trade-offs": 3, estimates: 3 };
    const older = {
      startedAt: T0 - 86_400_000,
      total: 6,
      max: 12,
      passed: false,
      debrief: {},
    };
    const state = { ...locked(scores), past: [older] };
    const next = recordResult(state, scoreResult(rubric, [], scores));
    expect(next.current?.scored).toBe(true);
    expect(next.past).toEqual([
      { startedAt: T0, total: 10, max: 12, passed: true, debrief: {} },
      older,
    ]);
    expect(recordResult(next, scoreResult(rubric, [], scores))).toBe(next);
  });

  it("won't record a run that's still going", () => {
    const state = { current: startRun(45, T0), past: [] };
    expect(recordResult(state, scoreResult(rubric, [], {}))).toBe(state);
  });

  it("saves the debrief on the run and its past entry", () => {
    const scores = { requirements: 3, "trade-offs": 1, estimates: 3 };
    const scored = recordResult(
      locked(scores),
      scoreResult(rubric, [], scores),
    );
    const next = setDebrief(scored, "trade-offs", "froze");
    expect(next.current?.debrief).toEqual({ "trade-offs": "froze" });
    expect(next.past[0]?.debrief).toEqual({ "trade-offs": "froze" });
  });
});

describe("rehearsal storage", () => {
  beforeEach(() => localStorage.clear());

  it("keeps rehearsals apart from the practice draft", () => {
    const draft = {
      answer: "My practice answer",
      scores: { requirements: 2 },
      seconds: 300,
      scored: false,
    };
    writeDraft("system-design", "unified-api", 1, draft);
    const run = editAnswer(startRun(45, T0), "Rehearsed answer", T0 + MINUTE);
    writeRehearsals("system-design", "unified-api", 1, {
      current: run,
      past: [],
    });
    expect(readDraft("system-design", "unified-api", 1)).toEqual(draft);
    expect(readRehearsals("system-design", "unified-api", 1).current).toEqual(
      run,
    );
    expect([...store.keys()].sort()).toEqual([
      "meritory.practice.system-design.unified-api.v1",
      "meritory.rehearsal.system-design.unified-api.v1",
    ]);
    writeRehearsals("system-design", "unified-api", 1, NO_REHEARSALS);
    expect(readDraft("system-design", "unified-api", 1)).toEqual(draft);
    expect([...store.keys()]).toEqual([
      "meritory.practice.system-design.unified-api.v1",
    ]);
  });

  it("keeps rehearsals per exercise version", () => {
    writeRehearsals("t", "e", 1, { current: startRun(5, T0), past: [] });
    expect(readRehearsals("t", "e", 2)).toEqual(NO_REHEARSALS);
  });

  it("drops runs and entries that don't fit", () => {
    store.set(
      "meritory.rehearsal.t.e.v1",
      JSON.stringify({
        current: {
          startedAt: T0,
          endsAt: T0 + 5 * MINUTE,
          answer: 7,
          lockedAt: T0 + 99 * MINUTE,
          scores: { a: 9, b: 2 },
          scored: true,
          debrief: { a: "froze", b: "maybe" },
        },
        past: [
          { startedAt: T0, total: 9, max: 12, passed: true },
          { startedAt: T0 + 1, total: 13, max: 12, passed: true },
          { startedAt: "x", total: 1, max: 12 },
          { startedAt: T0 + 2, total: 3, max: 12, passed: "yes" },
        ],
      }),
    );
    expect(readRehearsals("t", "e", 1)).toEqual({
      current: {
        startedAt: T0,
        endsAt: T0 + 5 * MINUTE,
        answer: "",
        lockedAt: null,
        scores: { b: 2 },
        scored: false,
        debrief: { a: "froze" },
      },
      past: [
        { startedAt: T0 + 2, total: 3, max: 12, passed: false, debrief: {} },
        { startedAt: T0, total: 9, max: 12, passed: true, debrief: {} },
      ],
    });
  });

  it("refuses a run with no sensible length", () => {
    store.set(
      "meritory.rehearsal.t.e.v1",
      JSON.stringify({ current: { startedAt: T0, endsAt: T0 }, past: [] }),
    );
    expect(readRehearsals("t", "e", 1).current).toBeNull();
  });

  it("ignores storage that isn't JSON", () => {
    store.set("meritory.rehearsal.t.e.v1", "{nope");
    expect(readRehearsals("t", "e", 1)).toEqual(NO_REHEARSALS);
  });

  it("keeps only the newest past rehearsals", () => {
    const past = Array.from({ length: MAX_PAST + 5 }, (_, i) => ({
      startedAt: T0 + i,
      total: 1,
      max: 12,
      passed: false,
      debrief: {},
    }));
    store.set("meritory.rehearsal.t.e.v1", JSON.stringify({ past }));
    const read = readRehearsals("t", "e", 1).past;
    expect(read).toHaveLength(MAX_PAST);
    expect(read[0]?.startedAt).toBe(T0 + MAX_PAST + 4);
  });
});
