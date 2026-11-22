export function longestClimb(heights: number[]): number {
  if (heights.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < heights.length; i++) {
    run = heights[i] > heights[i - 1] ? run + 1 : 1;
    // Check on every step, so a climb that reaches the end still counts
    best = Math.max(best, run);
  }
  return best;
}
