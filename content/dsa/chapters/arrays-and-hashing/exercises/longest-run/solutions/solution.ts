export function longestRun(days: number[]): number {
  const done = new Set(days);
  let longest = 0;
  for (const day of done) {
    if (done.has(day - 1)) continue;
    let length = 1;
    while (done.has(day + length)) length++;
    longest = Math.max(longest, length);
  }
  return longest;
}
