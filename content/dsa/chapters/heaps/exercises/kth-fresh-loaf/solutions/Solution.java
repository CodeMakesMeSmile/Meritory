import java.util.PriorityQueue;

class Solution {
    public int kthLoaf(int[][] ovens, int k) {
        // Each entry is {minute, oven, position}, and the heap holds one front per oven
        PriorityQueue<int[]> fronts = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        for (int o = 0; o < ovens.length; o++) {
            if (ovens[o].length > 0) fronts.offer(new int[] {ovens[o][0], o, 0});
        }
        // Take the earliest loaf k - 1 times, and the k-th is then on top
        for (int taken = 1; taken < k; taken++) {
            int[] front = fronts.poll();
            int o = front[1];
            int at = front[2] + 1;
            if (at < ovens[o].length) fronts.offer(new int[] {ovens[o][at], o, at});
        }
        return fronts.peek()[0];
    }
}
