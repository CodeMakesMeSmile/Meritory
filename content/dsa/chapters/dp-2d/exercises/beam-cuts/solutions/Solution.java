import java.util.Arrays;

class Solution {
    public long cheapestCuts(int length, int[] marks) {
        // Both ends of the beam and every mark, in order along the beam
        int count = marks.length + 2;
        long[] points = new long[count];
        int[] sorted = marks.clone();
        Arrays.sort(sorted);
        for (int i = 0; i < sorted.length; i++) points[i + 1] = sorted[i];
        points[count - 1] = length;
        // cost[i][j] is the least cost to cut at every mark strictly between points i and j
        long[][] cost = new long[count][count];
        // Points next to each other have no mark between them, so those ranges stay at 0
        for (int span = 2; span < count; span++) {
            for (int i = 0; i + span < count; i++) {
                int j = i + span;
                // Try every mark between them as the first cut in this piece
                long cheapest = Long.MAX_VALUE;
                for (int k = i + 1; k < j; k++) {
                    cheapest = Math.min(cheapest, cost[i][k] + cost[k][j]);
                }
                // The first cut costs the whole piece
                cost[i][j] = cheapest + points[j] - points[i];
            }
        }
        return cost[0][count - 1];
    }
}
