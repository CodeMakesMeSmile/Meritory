import java.util.Arrays;

class Solution {
    public int fewestCancellations(int[][] talks) {
        int[][] byEnd = talks.clone();
        Arrays.sort(byEnd, (a, b) -> Integer.compare(a[1], b[1]));
        int kept = 0;
        // The stage is free from this minute on
        int freeFrom = 0;
        for (int[] talk : byEnd) {
            // The talk that ends first leaves the most room, so keep each one that fits
            if (talk[0] >= freeFrom) {
                kept++;
                freeFrom = talk[1];
            }
        }
        return talks.length - kept;
    }
}
