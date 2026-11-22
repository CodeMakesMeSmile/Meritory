class Solution {
    public int fewestDeletions(String first, String second) {
        int n = first.length();
        int m = second.length();
        // kept[j] is the longest common subsequence of the first i letters of first and the first j of second
        int[] kept = new int[m + 1];
        for (int i = 1; i <= n; i++) {
            // The entry up and to the left, saved before the update overwrites it
            int diagonal = 0;
            for (int j = 1; j <= m; j++) {
                int above = kept[j];
                if (first.charAt(i - 1) == second.charAt(j - 1)) {
                    kept[j] = diagonal + 1;
                } else {
                    kept[j] = Math.max(above, kept[j - 1]);
                }
                diagonal = above;
            }
        }
        // Every letter outside the longest shared part has to go
        return n + m - 2 * kept[m];
    }
}
