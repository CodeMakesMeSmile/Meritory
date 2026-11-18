export function pairsWithGap(scores: number[], gap: number): number {
  const counts = new Map<number, number>();
  let pairs = 0;
  for (const score of scores) {
    pairs += counts.get(score - gap) ?? 0;
    if (gap !== 0) pairs += counts.get(score + gap) ?? 0;
    counts.set(score, (counts.get(score) ?? 0) + 1);
  }
  return pairs;
}
