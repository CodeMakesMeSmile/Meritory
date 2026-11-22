const MOD = 1_000_000_007;

export function changeWays(coins: number[], amount: number): number {
  // ways[a] counts the sets that make a from the coins handled so far
  const ways = new Array<number>(amount + 1).fill(0);
  ways[0] = 1;
  // Coins in the outer loop build each set in one order, so it's counted once
  for (const coin of coins) {
    for (let a = coin; a <= amount; a++) {
      ways[a] = (ways[a] + ways[a - coin]) % MOD;
    }
  }
  return ways[amount];
}
