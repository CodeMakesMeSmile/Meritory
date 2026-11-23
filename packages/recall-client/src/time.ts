const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type Unit = { size: number; short: string; one: string; many: string };

const UNITS: Unit[] = [
  { size: DAY, short: "d", one: "day", many: "days" },
  { size: HOUR, short: "h", one: "hour", many: "hours" },
  { size: MINUTE, short: "min", one: "minute", many: "minutes" },
];

/** The largest unit that fits, rounded, never below 1 minute */
function measure(from: Date, to: Date) {
  const span = Math.max(MINUTE, to.getTime() - from.getTime());
  const unit =
    UNITS.find((candidate) => span >= candidate.size) ??
    (UNITS[UNITS.length - 1] as Unit);
  return { count: Math.max(1, Math.round(span / unit.size)), unit };
}

/** On a rating button, such as "6 min" or "54 d" */
export function shortWait(from: Date, to: Date): string {
  const { count, unit } = measure(from, to);
  return `${count} ${unit.short}`;
}

/** In a sentence, such as "10 minutes" or "1 day" */
export function longWait(from: Date, to: Date): string {
  const { count, unit } = measure(from, to);
  return `${count} ${count === 1 ? unit.one : unit.many}`;
}
