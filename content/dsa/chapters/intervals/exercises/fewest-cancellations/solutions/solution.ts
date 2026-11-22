export function fewestCancellations(talks: number[][]): number {
  const byEnd = [...talks].sort((a, b) => a[1] - b[1]);
  let kept = 0;
  // The stage is free from this minute on
  let freeFrom = 0;
  for (const [start, end] of byEnd) {
    // The talk that ends first leaves the most room, so keep each one that fits
    if (start >= freeFrom) {
      kept++;
      freeFrom = end;
    }
  }
  return talks.length - kept;
}
