import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

class Solution {
    public int alertTime(int n, int[][] links, int start) {
        // Links only go one way, so each is listed under the relay that sends it
        List<List<int[]>> out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(new ArrayList<>());
        for (int[] link : links) out.get(link[0]).add(new int[] {link[1], link[2]});
        int[] time = new int[n];
        Arrays.fill(time, Integer.MAX_VALUE);
        time[start] = 0;
        // Each entry is {time, relay}, with the earliest on top
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[] {0, start});
        while (!heap.isEmpty()) {
            int[] entry = heap.poll();
            int at = entry[0];
            int relay = entry[1];
            // A stale entry, since this relay was already settled at an earlier time
            if (at > time[relay]) continue;
            for (int[] edge : out.get(relay)) {
                int next = edge[0];
                if (at + edge[1] < time[next]) {
                    time[next] = at + edge[1];
                    heap.offer(new int[] {time[next], next});
                }
            }
        }
        // Every relay hears at its own earliest time, so the last one to hear sets the answer
        int last = 0;
        for (int t : time) {
            if (t == Integer.MAX_VALUE) return -1;
            last = Math.max(last, t);
        }
        return last;
    }
}
