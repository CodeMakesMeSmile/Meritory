export function bestRun(profit: number[]): number {
  // The best total of a run that ends on the current day, and the best seen anywhere
  let here = profit[0];
  let best = profit[0];
  for (let i = 1; i < profit.length; i++) {
    // A run that adds up to less than zero only drags this day down, so start again
    here = Math.max(profit[i], here + profit[i]);
    best = Math.max(best, here);
  }
  return best;
}
