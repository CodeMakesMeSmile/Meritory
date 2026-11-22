function firstAtLeast(days: number[], target: number): number {
  let lo = 0;
  let hi = days.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (days[mid] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function bookingRange(days: number[], day: number): number[] {
  const start = firstAtLeast(days, day);
  if (start === days.length || days[start] !== day) return [-1, -1];
  // The first booking on a later day sits just past the last booking on this one
  const end = firstAtLeast(days, day + 1);
  return [start, end - 1];
}
