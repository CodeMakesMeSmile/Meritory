export function oldestEntry(totals: number[]): number {
  const last = totals[totals.length - 1];
  // Every slot before lo holds more than the last slot, and every one from hi on holds no more
  let lo = 0;
  let hi = totals.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (totals[mid] <= last) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
