export function mostAboard(riders: number[][]): number {
  const events: number[][] = [];
  for (const [board, leave] of riders) {
    events.push([board, 1], [leave, -1]);
  }
  // At the same stop, riders getting off come before riders getting on
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let aboard = 0;
  let most = 0;
  for (const [, change] of events) {
    aboard += change;
    most = Math.max(most, aboard);
  }
  return most;
}
