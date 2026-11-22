import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Queue;

class Solution {
    public int fewestRides(int n, int[][] routes, int start, int goal) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) neighbours.add(new ArrayList<>());
        for (int[] route : routes) {
            neighbours.get(route[0]).add(route[1]);
            neighbours.get(route[1]).add(route[0]);
        }
        // rides[i] stays -1 until island i is first reached, which is by the fewest rides
        int[] rides = new int[n];
        Arrays.fill(rides, -1);
        rides[start] = 0;
        Queue<Integer> queue = new ArrayDeque<>();
        queue.offer(start);
        while (!queue.isEmpty()) {
            int at = queue.poll();
            if (at == goal) return rides[at];
            for (int next : neighbours.get(at)) {
                // Marking an island as it joins the queue keeps it from joining twice
                if (rides[next] == -1) {
                    rides[next] = rides[at] + 1;
                    queue.offer(next);
                }
            }
        }
        return -1;
    }
}
