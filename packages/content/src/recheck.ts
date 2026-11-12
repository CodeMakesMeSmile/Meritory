/** Calendar months a fact stays current after its sources were checked */
export const RECHECK_MONTHS = 6;

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number, width: number) =>
  String(value).padStart(width, "0");

/**
 * The first day a fact is hidden, as YYYY-MM-DD. A day the target month
 * doesn't have moves back to that month's last day, so 31 August is due on
 * 28 February. Plain date math keeps the phone and the server in step,
 * since Hermes has no Temporal.
 */
export function dueOn(checkedOn: string): string {
  const match = DATE.exec(checkedOn);
  if (!match) throw new RangeError(`Not a YYYY-MM-DD date: ${checkedOn}`);
  const year = Number(match[1]);
  const month = Number(match[2]) - 1 + RECHECK_MONTHS;
  const day = Number(match[3]);

  // Day 0 of the following month is the last day of the target month
  const lastOfMonth = new Date(0);
  lastOfMonth.setUTCFullYear(year, month + 1, 0);
  const dueDay = Math.min(day, lastOfMonth.getUTCDate());

  return [
    pad(lastOfMonth.getUTCFullYear(), 4),
    pad(lastOfMonth.getUTCMonth() + 1, 2),
    pad(dueDay, 2),
  ].join("-");
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

/** Today's date in UTC, the same on every device */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
