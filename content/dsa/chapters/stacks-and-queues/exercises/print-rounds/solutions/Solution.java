import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int[] finishOrder(int[] pages, int k) {
        int[] left = pages.clone();
        Deque<Integer> queue = new ArrayDeque<>();
        for (int job = 0; job < pages.length; job++) queue.offer(job);
        int[] finished = new int[pages.length];
        int done = 0;
        while (!queue.isEmpty()) {
            int job = queue.poll();
            left[job] -= k;
            if (left[job] > 0) queue.offer(job);
            else finished[done++] = job;
        }
        return finished;
    }
}
