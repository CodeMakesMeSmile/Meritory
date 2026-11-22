export function bestTakings(
  weights: number[],
  takings: number[],
  capacity: number,
): number {
  // best[w] is the most takings from the crates so far, weighing at most w
  const best = new Array<number>(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    // Going down keeps best[w - weights[i]] from before this crate, so it's packed once
    for (let w = capacity; w >= weights[i]; w--) {
      best[w] = Math.max(best[w], best[w - weights[i]] + takings[i]);
    }
  }
  return best[capacity];
}
