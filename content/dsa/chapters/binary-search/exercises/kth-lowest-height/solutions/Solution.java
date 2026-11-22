class Solution {
    public int kthLowest(int[][] heights, int k) {
        int rows = heights.length;
        int cols = heights[0].length;
        // Longs, since hi - lo can reach 2 billion and pass the int limit
        long lo = heights[0][0];
        long hi = heights[rows - 1][cols - 1];
        // Every height before lo has fewer than k at or below it, and every one from hi on has k or more
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (countAtMost(heights, mid) >= k) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }

    // How many heights are at most limit, walking left from the top right as the rows go down
    private int countAtMost(int[][] heights, long limit) {
        int count = 0;
        int col = heights[0].length - 1;
        for (int[] row : heights) {
            while (col >= 0 && row[col] > limit) col--;
            count += col + 1;
        }
        return count;
    }
}
