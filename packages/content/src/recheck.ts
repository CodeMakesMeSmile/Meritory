/** Calendar months a fact stays current after its sources were checked */
export const RECHECK_MONTHS = 6;

/** How far ahead the recheck report looks for facts coming due */
export const DUE_SOON_DAYS = 30;

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number, width: number) =>
  String(value).padStart(width, "0");

function parseDate(date: string): [year: number, month: number, day: number] {
  const match = DATE.exec(date);
  if (!match) throw new RangeError(`Not a YYYY-MM-DD date: ${date}`);
  return [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
}

// setUTCFullYear keeps years below 100 as written, unlike Date.UTC
function utcDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  return date;
}

function formatDate(date: Date): string {
  return [
    pad(date.getUTCFullYear(), 4),
    pad(date.getUTCMonth() + 1, 2),
    pad(date.getUTCDate(), 2),
  ].join("-");
}

/**
 * The first day a fact is hidden, as YYYY-MM-DD. A day the target month
 * doesn't have moves back to that month's last day, so 31 August is due on
 * 28 February. Plain date math keeps the phone and the server in step,
 * since Hermes has no Temporal.
 */
export function dueOn(checkedOn: string): string {
  const [year, month, day] = parseDate(checkedOn);
  // Day 0 of the following month is the last day of the target month
  const lastOfMonth = utcDate(year, month + RECHECK_MONTHS + 1, 0);
  const dueDay = Math.min(day, lastOfMonth.getUTCDate());
  return formatDate(
    utcDate(lastOfMonth.getUTCFullYear(), lastOfMonth.getUTCMonth(), dueDay),
  );
}

/** The day a number of days after the given one */
export function addDays(date: string, days: number): string {
  const [year, month, day] = parseDate(date);
  return formatDate(utcDate(year, month, day + days));
}

/** Whether learners may see the fact on the given UTC day */
export function isCurrent(fact: { checkedOn: string }, today: string): boolean {
  return today < dueOn(fact.checkedOn);
}

/** The facts learners may see on the given UTC day */
export function currentFacts<T extends { checkedOn: string }>(
  facts: readonly T[],
  today: string,
): T[] {
  return facts.filter((fact) => isCurrent(fact, today));
}

export type Due<T> = { fact: T; dueOn: string };

export type RecheckReport<T> = {
  /** Already hidden from learners */
  overdue: Due<T>[];
  /** Still shown, but due within DUE_SOON_DAYS */
  dueSoon: Due<T>[];
};

/** Facts that need a recheck, earliest due first */
export function recheckReport<T extends { checkedOn: string }>(
  facts: readonly T[],
  today: string,
): RecheckReport<T> {
  const horizon = addDays(today, DUE_SOON_DAYS);
  const due = facts
    .map((fact) => ({ fact, dueOn: dueOn(fact.checkedOn) }))
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  return {
    overdue: due.filter((item) => item.dueOn <= today),
    dueSoon: due.filter((item) => item.dueOn > today && item.dueOn <= horizon),
  };
}

/** Today's date in UTC, the same on every device */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
