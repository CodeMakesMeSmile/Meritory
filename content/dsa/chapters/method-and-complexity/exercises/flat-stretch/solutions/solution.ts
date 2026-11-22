export function flatStretch(levels: number[]): number {
  if (levels.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < levels.length; i++) {
    run = levels[i] === levels[i - 1] ? run + 1 : 1;
    // Check on every step, so a stretch that reaches the end still counts
    best = Math.max(best, run);
  }
  return best;
}
