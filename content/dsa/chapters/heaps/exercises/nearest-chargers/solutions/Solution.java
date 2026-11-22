import java.util.PriorityQueue;

class Solution {
    public int[][] nearestChargers(int[][] chargers, int k) {
        // The farthest of the k nearest so far sits on top, ready to be pushed out
        PriorityQueue<int[]> nearest = new PriorityQueue<>((a, b) -> Integer.compare(distance(b), distance(a)));
        for (int[] charger : chargers) {
            nearest.offer(charger);
            if (nearest.size() > k) nearest.poll();
        }
        return nearest.toArray(new int[0][]);
    }

    // The squared distance orders chargers the same way, with no square root
    private static int distance(int[] p) {
        return p[0] * p[0] + p[1] * p[1];
    }
}
