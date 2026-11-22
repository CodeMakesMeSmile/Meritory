class Solution {
    public int[] lampCounts(int n) {
        int[] counts = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            // i & (i - 1) is i with its lowest 1 cleared, a smaller number already counted
            counts[i] = counts[i & (i - 1)] + 1;
        }
        return counts;
    }
}
