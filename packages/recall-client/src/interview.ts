import type { InterviewDateResponse } from "@meritory/contracts";

/** December 14, from 2026-12-14, whatever the reader's time zone */
export function dayName(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** December 14, 2026, for a date shown on its own */
export function dayAndYear(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export const INTERVIEW_DESCRIPTION =
  "Optional. Add your date and recall gets more thorough in the weeks before it, so more cards are fresh on the day.";

/** The everyday and pre-interview targets, in whole percents */
export interface InterviewTargets {
  recallTarget: number;
  interviewTarget: number;
}

const SUGGESTED_TARGETS: InterviewTargets = {
  recallTarget: 90,
  interviewTarget: 95,
};

/** What the line under the date field says for each stage */
export function interviewStatusLine(
  state: InterviewDateResponse,
  targets: InterviewTargets = SUGGESTED_TARGETS,
): string | null {
  if (!state.date) return null;
  const sooner = `cards come back a bit sooner, aiming for ${targets.interviewTarget}% recall instead of ${targets.recallTarget}%.`;
  if (state.status === "on") {
    return `On now. Until ${dayName(state.date)}, ${sooner}`;
  }
  if (state.status === "later" && state.startsOn) {
    return `Saved. From ${dayName(state.startsOn)}, ${sooner}`;
  }
  if (state.status === "passed") {
    return `${dayName(state.date)} has passed, so recall is back to your usual ${targets.recallTarget}%. Add a new date any time.`;
  }
  return null;
}

/** Whether Home links to the date, which it does while one is coming up */
export function interviewIsAhead(state: InterviewDateResponse | null): boolean {
  return (
    state?.date != null && (state.status === "on" || state.status === "later")
  );
}
