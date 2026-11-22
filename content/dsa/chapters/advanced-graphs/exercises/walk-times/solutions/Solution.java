import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

class Solution {
    public int[] walkTimes(int n, int[][] paths, int start) {
        // Footpaths go both ways, so each is listed under both stalls
        List<List<int[]>> out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(new ArrayList<>());
        for (int[] path : paths) {
            out.get(path[0]).add(new int[] {path[1], path[2]});
            out.get(path[1]).add(new int[] {path[0], path[2]});
        }
        int[] time = new int[n];
        Arrays.fill(time, Integer.MAX_VALUE);
        time[start] = 0;
        // Each entry is {minutes, stall}, with the quickest on top
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[] {0, start});
        while (!heap.isEmpty()) {
            int[] entry = heap.poll();
            int at = entry[0];
            int stall = entry[1];
            // A stale entry, since this stall was already settled by a quicker walk
            if (at > time[stall]) continue;
            for (int[] edge : out.get(stall)) {
                int next = edge[0];
                if (at + edge[1] < time[next]) {
                    time[next] = at + edge[1];
                    heap.offer(new int[] {time[next], next});
                }
            }
        }
        for (int i = 0; i < n; i++) {
            if (time[i] == Integer.MAX_VALUE) time[i] = -1;
        }
        return time;
    }
}
