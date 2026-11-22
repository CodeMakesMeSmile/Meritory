class Solution {
    private static final long MOD = 1_000_000_007L;

    public int orchardPaths(int[][] orchard) {
        int cols = orchard[0].length;
        // Before a row is handled, row[c] holds the paths into the plot above
        long[] row = new long[cols];
        // One path comes into the gate, as if from above
        row[0] = 1;
        for (int[] plots : orchard) {
            for (int c = 0; c < cols; c++) {
                if (plots[c] == 1) {
                    row[c] = 0;
                } else if (c > 0) {
                    // Paths from above are already in row[c], so add the paths from the left
                    row[c] = (row[c] + row[c - 1]) % MOD;
                }
            }
        }
        return (int) row[cols - 1];
    }
}
