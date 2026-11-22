export function teamFree(
  calendars: number[][],
  dayStart: number,
  dayEnd: number,
): number[][] {
  // Every busy time from every calendar, as [start, end]
  const busy: number[][] = [];
  for (const calendar of calendars) {
    for (let k = 0; k < calendar.length; k += 2) {
      busy.push([calendar[k], calendar[k + 1]]);
    }
  }
  busy.sort((a, b) => a[0] - b[0]);
  const gaps: number[][] = [];
  // Nobody is busy from here until the next busy time starts
  let freeFrom = dayStart;
  for (const [start, end] of busy) {
    if (start > freeFrom) gaps.push([freeFrom, Math.min(start, dayEnd)]);
    freeFrom = Math.max(freeFrom, end);
    if (freeFrom >= dayEnd) break;
  }
  if (freeFrom < dayEnd) gaps.push([freeFrom, dayEnd]);
  return gaps;
}
