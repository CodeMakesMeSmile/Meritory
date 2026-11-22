import java.util.PriorityQueue;

class CutoffBoard {
    // Holds the k best scores, with the lowest of them, the cutoff, on top
    private final PriorityQueue<Integer> best = new PriorityQueue<>();
    private final int k;

    public CutoffBoard(int k, int[] scores) {
        this.k = k;
        for (int score : scores) add(score);
    }

    public int add(int score) {
        best.offer(score);
        if (best.size() > k) best.poll();
        return best.peek();
    }
}
