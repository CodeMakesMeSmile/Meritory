import java.util.Arrays;

class Solution {
    public int mostAboard(int[][] riders) {
        int[][] events = new int[riders.length * 2][];
        for (int i = 0; i < riders.length; i++) {
            events[2 * i] = new int[] {riders[i][0], 1};
            events[2 * i + 1] = new int[] {riders[i][1], -1};
        }
        // At the same stop, riders getting off come before riders getting on
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        int aboard = 0;
        int most = 0;
        for (int[] event : events) {
            aboard += event[1];
            most = Math.max(most, aboard);
        }
        return most;
    }
}
