export function slowestPace(chapters: number[], hours: number): number {
  // Hours a pace needs, one chapter at a time
  const hoursAt = (pace: number): number => {
    let total = 0;
    for (const pages of chapters) total += Math.ceil(pages / pace);
    return total;
  };
  let longest = 0;
  for (const pages of chapters) longest = Math.max(longest, pages);
  // Every pace before lo is too slow, and every pace from hi on finishes in time
  let lo = 1;
  let hi = longest;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (hoursAt(mid) <= hours) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
