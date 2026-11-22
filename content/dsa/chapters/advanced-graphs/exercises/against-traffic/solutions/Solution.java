import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;

class Solution {
    public int fewestAgainst(int n, int[][] streets, int start, int goal) {
        // Each entry is {junction, cost}: riding the right way costs 0, and walking the wrong way costs 1
        List<List<int[]>> out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(new ArrayList<>());
        for (int[] street : streets) {
            out.get(street[0]).add(new int[] {street[1], 0});
            out.get(street[1]).add(new int[] {street[0], 1});
        }
        int[] walked = new int[n];
        Arrays.fill(walked, Integer.MAX_VALUE);
        boolean[] done = new boolean[n];
        walked[start] = 0;
        Deque<Integer> junctions = new ArrayDeque<>();
        junctions.offerFirst(start);
        while (!junctions.isEmpty()) {
            int at = junctions.pollFirst();
            // A junction can be added more than once, and only its first time out counts
            if (done[at]) continue;
            done[at] = true;
            for (int[] edge : out.get(at)) {
                int next = edge[0];
                int cost = edge[1];
                if (walked[at] + cost < walked[next]) {
                    walked[next] = walked[at] + cost;
                    // Riding costs nothing more, so it goes to the front, and walking waits at the back
                    if (cost == 0) {
                        junctions.offerFirst(next);
                    } else {
                        junctions.offerLast(next);
                    }
                }
            }
        }
        return walked[goal] == Integer.MAX_VALUE ? -1 : walked[goal];
    }
}
