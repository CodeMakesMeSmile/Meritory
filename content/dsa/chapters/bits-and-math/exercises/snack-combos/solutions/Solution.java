class Solution {
    public int snackCombos(int[] prices, int budget) {
        int n = prices.length;
        int ways = 0;
        // Each mask from 1 up is a different non-empty group, with bit i meaning snack i is in
        for (int mask = 1; mask < 1 << n; mask++) {
            int total = 0;
            for (int i = 0; i < n; i++) {
                if (((mask >> i) & 1) == 1) {
                    total += prices[i];
                }
            }
            if (total == budget) {
                ways++;
            }
        }
        return ways;
    }
}
