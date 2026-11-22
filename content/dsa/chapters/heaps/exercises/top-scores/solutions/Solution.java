import java.util.PriorityQueue;

class Solution {
    public int[] topScores(int[] scores, int k) {
        // The lowest of the k best scores so far sits on top, ready to be pushed out
        PriorityQueue<Integer> best = new PriorityQueue<>();
        for (int score : scores) {
            best.offer(score);
            if (best.size() > k) best.poll();
        }
        // The heap gives them up lowest first, so fill the answer from the back
        int[] top = new int[best.size()];
        for (int i = top.length - 1; i >= 0; i--) top[i] = best.poll();
        return top;
    }
}
