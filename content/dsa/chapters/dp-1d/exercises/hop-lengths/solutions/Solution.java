class Solution {
    private static final long MOD = 1_000_000_007L;

    public int hopWays(int distance, int[] hops) {
        // ways[d] is the number of jump sequences that land exactly on square d
        long[] ways = new long[distance + 1];
        ways[0] = 1;
        for (int d = 1; d <= distance; d++) {
            for (int hop : hops) {
                // The last jump could have been any length that fits
                if (hop <= d) ways[d] = (ways[d] + ways[d - hop]) % MOD;
            }
        }
        return (int) ways[distance];
    }
}
