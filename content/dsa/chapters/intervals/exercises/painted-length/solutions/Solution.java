import java.util.Arrays;

class Solution {
    public int paintedLength(int[][] stretches) {
        int[][] byStart = stretches.clone();
        Arrays.sort(byStart, (a, b) -> Integer.compare(a[0], b[0]));
        int total = 0;
        // The merged stretch being built, empty to begin with
        int groupStart = -1;
        int groupEnd = -1;
        for (int[] stretch : byStart) {
            if (stretch[0] > groupEnd) {
                // A gap, so the stretch so far is finished
                total += groupEnd - groupStart;
                groupStart = stretch[0];
                groupEnd = stretch[1];
            } else {
                groupEnd = Math.max(groupEnd, stretch[1]);
            }
        }
        return total + groupEnd - groupStart;
    }
}
