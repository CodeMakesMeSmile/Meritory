class Solution {
    private static final long MOD = 1_000_000_007L;

    public int changeWays(int[] coins, int amount) {
        // ways[a] counts the sets that make a from the coins handled so far
        long[] ways = new long[amount + 1];
        ways[0] = 1;
        // Coins in the outer loop build each set in one order, so it's counted once
        for (int coin : coins) {
            for (int a = coin; a <= amount; a++) {
                ways[a] = (ways[a] + ways[a - coin]) % MOD;
            }
        }
        return (int) ways[amount];
    }
}
