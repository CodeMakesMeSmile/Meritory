export function bestShiftPay(pay: number[]): number {
  // The best pay from every shift but the last one seen, and from all of them
  let before = 0;
  let best = 0;
  for (const amount of pay) {
    // Skip this shift, or take it on top of the best from two shifts back
    const next = Math.max(best, before + amount);
    before = best;
    best = next;
  }
  return best;
}
