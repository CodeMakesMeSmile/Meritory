class Solution {
    public long cheapestJoin(int[] piles) {
        int n = piles.length;
        // prefix[i] is the weight of the first i piles, so a range's weight is one subtraction
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + piles[i];
        // cost[i][j] is the least fuel to join piles i to j into one, and a single pile costs 0
        long[][] cost = new long[n][n];
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length <= n; i++) {
                int j = i + length - 1;
                // The last join puts piles i to k together with piles k + 1 to j
                long cheapest = Long.MAX_VALUE;
                for (int k = i; k < j; k++) {
                    cheapest = Math.min(cheapest, cost[i][k] + cost[k + 1][j]);
                }
                // Whatever the split, the last join weighs the whole range
                cost[i][j] = cheapest + prefix[j + 1] - prefix[i];
            }
        }
        return cost[0][n - 1];
    }
}
