import { recallDayStart } from "./day.ts";
import { DEFAULT_RECALL_TARGET } from "./scheduler.ts";

/** The recall target in the weeks before an interview */
export const INTERVIEW_RECALL_TARGET = 0.95;

/** How many days before the interview the higher target starts */
export const INTERVIEW_WINDOW_DAYS = 28;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 24 * 60 * 60 * 1000;

function parts(date: string): [number, number, number] {
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  return [year, month, day];
}

/** Whether text is a real calendar date written as YYYY-MM-DD */
export function isCalendarDate(text: string): boolean {
  if (!DATE.test(text)) return false;
  const [year, month, day] = parts(text);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Moves a YYYY-MM-DD date by whole days */
export function addDays(date: string, days: number): string {
  const [year, month, day] = parts(date);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY)
    .toISOString()
    .slice(0, 10);
}

/** The calendar date of the learner's current recall day, as YYYY-MM-DD */
export function recallDate(now: Date, timeZone: string): string {
  // en-CA writes dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(recallDayStart(now, timeZone));
}

/** The first day of the higher target for an interview on this date */
export function interviewWindowStart(interviewDate: string): string {
  return addDays(interviewDate, -INTERVIEW_WINDOW_DAYS);
}

export type InterviewStatus = "none" | "later" | "on" | "passed";

/** Where today sits against the interview date */
export function interviewStatus(
  interviewDate: string | null,
  today: string,
): InterviewStatus {
  if (!interviewDate) return "none";
  if (today > interviewDate) return "passed";
  return today < interviewWindowStart(interviewDate) ? "later" : "on";
}

/** The recall target for reviews made on this recall day */
export function recallTargetFor(
  interviewDate: string | null,
  today: string,
): number {
  return interviewStatus(interviewDate, today) === "on"
    ? INTERVIEW_RECALL_TARGET
    : DEFAULT_RECALL_TARGET;
}
