import java.util.Arrays;

class Solution {
    public int cheapestRoute(int n, int[][] routes, int source, int target, int maxStops) {
        int[] price = new int[n];
        Arrays.fill(price, Integer.MAX_VALUE);
        price[source] = 0;
        // maxStops stops means maxStops + 1 routes, and each round adds one more route
        for (int round = 0; round <= maxStops; round++) {
            // Read last round's prices and write to a copy, so one round can't chain two routes
            int[] next = price.clone();
            for (int[] route : routes) {
                int from = route[0];
                // Checking first keeps MAX_VALUE + cost from overflowing
                if (price[from] != Integer.MAX_VALUE && price[from] + route[2] < next[route[1]]) {
                    next[route[1]] = price[from] + route[2];
                }
            }
            price = next;
        }
        return price[target] == Integer.MAX_VALUE ? -1 : price[target];
    }
}
