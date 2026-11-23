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
  "Optional. Add your date and recall gets more thorough in the last 4 weeks, so more cards are fresh on the day. You'll see a few more cards each day while it's on.";

const SOONER =
  "cards come back a bit sooner, aiming for 95% recall instead of 90%.";

/** What the line under the date field says for each stage */
export function interviewStatusLine(
  state: InterviewDateResponse,
): string | null {
  if (!state.date) return null;
  if (state.status === "on") {
    return `On now. Until ${dayName(state.date)}, ${SOONER}`;
  }
  if (state.status === "later" && state.startsOn) {
    return `Saved. From ${dayName(state.startsOn)}, ${SOONER}`;
  }
  if (state.status === "passed") {
    return `${dayName(state.date)} has passed, so recall is back to its usual 90%. Add a new date any time.`;
  }
  return null;
}

/** Whether Home links to the date, which it does while one is coming up */
export function interviewIsAhead(state: InterviewDateResponse | null): boolean {
  return (
    state?.date != null && (state.status === "on" || state.status === "later")
  );
}
