import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

class Solution {
    public boolean hasCircularWait(int n, int[][] waits) {
        // A wait {a, b} means b must finish first, so b unlocks a
        List<List<Integer>> unlocks = new ArrayList<>();
        for (int i = 0; i < n; i++) unlocks.add(new ArrayList<>());
        int[] waiting = new int[n];
        for (int[] wait : waits) {
            unlocks.get(wait[1]).add(wait[0]);
            waiting[wait[0]]++;
        }
        Queue<Integer> ready = new ArrayDeque<>();
        for (int step = 0; step < n; step++) if (waiting[step] == 0) ready.offer(step);
        int finished = 0;
        // Kahn's algorithm: finish a ready step, then free whatever was only waiting on it
        while (!ready.isEmpty()) {
            int step = ready.poll();
            finished++;
            for (int next : unlocks.get(step)) {
                waiting[next]--;
                if (waiting[next] == 0) ready.offer(next);
            }
        }
        // A step in a circle, or behind one, never becomes ready
        return finished < n;
    }
}
