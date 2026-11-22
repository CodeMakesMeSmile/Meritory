import java.util.Collections;
import java.util.PriorityQueue;

class MedianBoard {
    // low holds the smaller half with its largest on top, and high holds the larger half
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
    private final PriorityQueue<Integer> high = new PriorityQueue<>();

    public void record(int reading) {
        // Passing each reading through low keeps every value in low at most every value in high
        low.offer(reading);
        high.offer(low.poll());
        // Keep low the same size as high, or one bigger
        if (high.size() > low.size()) low.offer(high.poll());
    }

    public double median() {
        if (low.size() > high.size()) return low.peek();
        return ((double) low.peek() + high.peek()) / 2.0;
    }
}
