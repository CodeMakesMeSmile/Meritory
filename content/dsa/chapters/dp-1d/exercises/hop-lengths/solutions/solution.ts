const MOD = 1_000_000_007;

export function hopWays(distance: number, hops: number[]): number {
  // ways[d] is the number of jump sequences that land exactly on square d
  const ways = new Array<number>(distance + 1).fill(0);
  ways[0] = 1;
  for (let d = 1; d <= distance; d++) {
    for (const hop of hops) {
      // The last jump could have been any length that fits
      if (hop <= d) ways[d] = (ways[d] + ways[d - hop]) % MOD;
    }
  }
  return ways[distance];
}
