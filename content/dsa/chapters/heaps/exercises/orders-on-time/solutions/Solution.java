import java.util.Arrays;
import java.util.Collections;
import java.util.PriorityQueue;

class Solution {
    public int mostOnTime(int[][] orders) {
        int[][] byDue = orders.clone();
        Arrays.sort(byDue, (a, b) -> Integer.compare(a[1], b[1]));
        // The bake times of the orders taken so far, with the longest on top
        PriorityQueue<Integer> taken = new PriorityQueue<>(Collections.reverseOrder());
        int finish = 0;
        for (int[] order : byDue) {
            taken.offer(order[0]);
            finish += order[0];
            // Too late, so drop the longest bake taken, which frees the most oven time
            if (finish > order[1]) finish -= taken.poll();
        }
        return taken.size();
    }
}
