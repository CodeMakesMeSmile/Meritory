import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Rubric } from "@/lib/practice";
import {
  editAnswer,
  lockRun,
  type Rehearsals,
  type Run,
  type Stage,
  startRun,
} from "@/lib/rehearsal";
import { RehearsalStage } from "./rehearsal";

const levels = ["Weak.", "Thin.", "Solid.", "Strong."];

const rubric = {
  id: "design-review",
  title: "Design review",
  criteria: [
    { id: "requirements", name: "Requirements", scoredBy: "self", levels },
    { id: "trade-offs", name: "Trade-offs", scoredBy: "self", levels },
    { id: "estimates", name: "Estimates", scoredBy: "self", levels },
  ],
  pass: { total: 8, lowest: 2 },
  hash: "h",
  version: 1,
} as Rubric;

const T0 = new Date(2026, 10, 20, 15, 0, 0).getTime();
const MINUTE = 60_000;

function render(stage: Stage, rehearsals: Rehearsals, now: number) {
  const noop = () => {};
  return renderToStaticMarkup(
    <RehearsalStage
      stage={stage}
      rehearsals={rehearsals}
      now={now}
      minutes={45}
      rubric={rubric}
      requires={[]}
      answer="THE MODEL ANSWER"
      onStart={noop}
      onEdit={noop}
      onFinish={noop}
      onPick={noop}
      onShowResult={noop}
      onDebrief={noop}
      onBack={noop}
    />,
  );
}

const written = editAnswer(startRun(45, T0), "Queue the sync jobs", T0);

function textarea(html: string) {
  return /<textarea[^>]*>/.exec(html)?.[0] ?? "";
}

describe("rehearsal stages", () => {
  it("lists past rehearsals, newest first", () => {
    const html = render(
      "start",
      {
        current: null,
        past: [
          { startedAt: T0, total: 9, max: 12, passed: true, debrief: {} },
          {
            startedAt: T0 - 2 * 86_400_000,
            total: 6,
            max: 12,
            passed: false,
            debrief: {},
          },
        ],
      },
      T0,
    );
    expect(html).toContain("Rehearse in 45 minutes");
    expect(html).toMatch(
      /Nov 20.*9 of 12.*Pass.*Nov 18.*6 of 12.*Not a pass yet/,
    );
    expect(html).not.toContain("<textarea");
  });

  it("says what goes in the list before the first rehearsal", () => {
    const html = render("start", { current: null, past: [] }, T0);
    expect(html).toContain("None yet.");
    expect(html).not.toContain("<table");
  });

  it("shows the countdown while it runs, with no hints or answers", () => {
    const html = render(
      "running",
      { current: written, past: [] },
      T0 + 13 * MINUTE + 18_000,
    );
    expect(html).toContain('role="timer"');
    expect(html).toContain("31:42");
    expect(html).toContain("Finish early");
    expect(html).toContain("Queue the sync jobs");
    expect(textarea(html)).not.toContain("readOnly");
    expect(textarea(html)).not.toContain("readonly");
    expect(html).not.toContain("Weak.");
    expect(html).not.toContain("THE MODEL ANSWER");
    expect(html).not.toContain("Write it the way");
    // The clock is read on request, never announced every second
    expect(html).not.toMatch(/role="timer"[^>]*aria-live/);
  });

  it("locks the answer at zero, then asks for scores", () => {
    const html = render(
      "locked",
      { current: lockRun(written, T0 + 50 * MINUTE), past: [] },
      T0 + 50 * MINUTE,
    );
    expect(html).toContain("Time&#x27;s up");
    expect(html).toContain("0:00");
    expect(textarea(html)).toMatch(/readonly/i);
    expect(html).toContain("Score yourself");
    expect(html).toContain("Weak.");
    expect(html).toContain("Show my result");
    expect(html).not.toContain("Finish early");
    expect(html).not.toContain("THE MODEL ANSWER");
  });

  it("locks the answer when it's past the deadline but not saved yet", () => {
    const html = render(
      "locked",
      { current: written, past: [] },
      T0 + 46 * MINUTE,
    );
    expect(html).toContain("Time&#x27;s up");
    expect(textarea(html)).toMatch(/readonly/i);
  });

  it("says how much time was left when finished early", () => {
    const html = render(
      "locked",
      { current: lockRun(written, T0 + 32 * MINUTE + 20_000), past: [] },
      T0 + 40 * MINUTE,
    );
    expect(html).toContain("Finished with 12:40 to spare");
    expect(html).not.toContain('role="timer"');
  });

  it("debriefs the criteria under level 3, then shows the model answer", () => {
    const run: Run = {
      ...lockRun(written, T0 + 45 * MINUTE),
      scores: { requirements: 3, "trade-offs": 1, estimates: 2 },
      scored: true,
      debrief: { "trade-offs": "froze" },
    };
    const html = render("done", { current: run, past: [] }, T0 + 50 * MINUTE);
    expect(html).toContain("Not a pass yet");
    expect(html).toContain("You scored 6 of 12.");
    expect(html).toContain("Locked when time ran out, after 45:00.");
    expect(html).toContain("What got in the way?");
    expect(html).toContain("Trade-offs, level 1");
    expect(html).toContain("Estimates, level 2");
    expect(html).not.toContain("Requirements, level 3");
    expect(html).toContain("I knew it but froze");
    expect(html).toMatch(/checked="" value="froze"/);
    expect(html).not.toMatch(/checked="" value="unknown"/);
    expect(html).toContain("THE MODEL ANSWER");
    expect(html).toContain("Back to rehearsals");
    expect(textarea(html)).toMatch(/readonly/i);
  });

  it("skips the debrief when nothing is under the bar", () => {
    const run: Run = {
      ...lockRun(written, T0 + 20 * MINUTE),
      scores: { requirements: 3, "trade-offs": 4, estimates: 3 },
      scored: true,
    };
    const html = render("done", { current: run, past: [] }, T0 + 30 * MINUTE);
    expect(html).toContain("That&#x27;s a pass");
    expect(html).toContain("Locked when you finished, after 20:00.");
    expect(html).not.toContain("What got in the way?");
    expect(html).toContain("THE MODEL ANSWER");
  });
});
