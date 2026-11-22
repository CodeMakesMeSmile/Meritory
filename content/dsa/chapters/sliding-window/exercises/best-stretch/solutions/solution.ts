export function bestStretch(sales: number[], k: number): number {
  let total = 0;
  let best = 0;
  for (let right = 0; right < sales.length; right++) {
    total += sales[right];
    // Once the window is full, the day k back leaves as this one enters
    if (right >= k) total -= sales[right - k];
    if (right >= k - 1) best = Math.max(best, total);
  }
  return best;
}
