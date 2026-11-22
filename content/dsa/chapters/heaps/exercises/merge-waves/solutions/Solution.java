import java.util.PriorityQueue;

class Solution {
    public int[] mergeWaves(int[][] waves) {
        // Each entry is {time, wave, position}, and the heap holds one front per wave
        PriorityQueue<int[]> fronts = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        int total = 0;
        for (int w = 0; w < waves.length; w++) {
            total += waves[w].length;
            if (waves[w].length > 0) fronts.offer(new int[] {waves[w][0], w, 0});
        }
        int[] merged = new int[total];
        int filled = 0;
        while (!fronts.isEmpty()) {
            int[] front = fronts.poll();
            merged[filled++] = front[0];
            int w = front[1];
            int at = front[2] + 1;
            // The next time in the same wave takes its place
            if (at < waves[w].length) fronts.offer(new int[] {waves[w][at], w, at});
        }
        return merged;
    }
}
