import java.util.Collections;
import java.util.PriorityQueue;

class Solution {
    public double[] runningMedians(int[] times) {
        // low holds the shorter half with its longest on top, and high holds the longer half
        PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
        PriorityQueue<Integer> high = new PriorityQueue<>();
        double[] medians = new double[times.length];
        for (int i = 0; i < times.length; i++) {
            // Passing each time through low keeps every value in low at most every value in high
            low.offer(times[i]);
            high.offer(low.poll());
            // Keep low the same size as high, or one bigger
            if (high.size() > low.size()) low.offer(high.poll());
            double middle = low.peek();
            medians[i] = low.size() > high.size() ? middle : (middle + high.peek()) / 2.0;
        }
        return medians;
    }
}
