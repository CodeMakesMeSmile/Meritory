function firstAtLeast(readings: number[], target: number): number {
  let lo = 0;
  let hi = readings.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (readings[mid] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function countBetween(
  readings: number[],
  low: number,
  high: number,
): number {
  if (low > high) return 0;
  // Readings in range run from the first at least low to just before the first above high
  return firstAtLeast(readings, high + 1) - firstAtLeast(readings, low);
}
