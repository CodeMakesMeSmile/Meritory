export function snackCombos(prices: number[], budget: number): number {
  const n = prices.length;
  let ways = 0;
  // Each mask from 1 up is a different non-empty group, with bit i meaning snack i is in
  for (let mask = 1; mask < 1 << n; mask++) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) total += prices[i];
    }
    if (total === budget) ways++;
  }
  return ways;
}
