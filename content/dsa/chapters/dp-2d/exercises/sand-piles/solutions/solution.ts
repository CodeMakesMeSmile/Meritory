export function cheapestJoin(piles: number[]): number {
  const n = piles.length;
  // prefix[i] is the weight of the first i piles, so a range's weight is one subtraction
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + piles[i];
  // cost[i][j] is the least fuel to join piles i to j into one, and a single pile costs 0
  const cost = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let length = 2; length <= n; length++) {
    for (let i = 0; i + length <= n; i++) {
      const j = i + length - 1;
      // The last join puts piles i to k together with piles k + 1 to j
      let cheapest = Infinity;
      for (let k = i; k < j; k++) {
        cheapest = Math.min(cheapest, cost[i][k] + cost[k + 1][j]);
      }
      // Whatever the split, the last join weighs the whole range
      cost[i][j] = cheapest + prefix[j + 1] - prefix[i];
    }
  }
  return cost[0][n - 1];
}
