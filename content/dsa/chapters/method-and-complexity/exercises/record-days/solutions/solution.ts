export function recordDays(highs: number[]): number[] {
  const records: number[] = [];
  let best = -Infinity;
  for (let i = 0; i < highs.length; i++) {
    // A record has to beat the best so far, so a tie doesn't count
    if (highs[i] > best) {
      records.push(i);
      best = highs[i];
    }
  }
  return records;
}
