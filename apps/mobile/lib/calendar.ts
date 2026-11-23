const pad = (n: number) => String(n).padStart(2, "0");

/** A calendar date as YYYY-MM-DD */
export const dateText = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

/** Today on this phone, as YYYY-MM-DD */
export function localToday(now: Date = new Date()): string {
  return dateText(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export interface Month {
  year: number;
  /** 1 for January */
  month: number;
}

export function monthOf(date: string): Month {
  const [year = 1970, month = 1] = date.split("-").map(Number);
  return { year, month };
}

export function addMonths({ year, month }: Month, by: number): Month {
  const index = year * 12 + (month - 1) + by;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** November 2026 */
export function monthLabel({ year, month }: Month): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** The month as rows of seven, Sunday first, with null where a row has no day */
export function monthRows({ year, month }: Month): (string | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let day = 1; day <= days; day++) cells.push(dateText(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let at = 0; at < cells.length; at += 7)
    rows.push(cells.slice(at, at + 7));
  return rows;
}

/** YYYY-MM-DD dates sort as text, so a plain comparison is enough */
export const isBefore = (date: string, other: string) => date < other;

/** Whether the month has any day that can still be picked */
export function monthIsPast(month: Month, today: string): boolean {
  const next = addMonths(month, 1);
  return dateText(next.year, next.month, 1) <= today;
}

export const dayOfMonth = (date: string) => Number(date.slice(8));
