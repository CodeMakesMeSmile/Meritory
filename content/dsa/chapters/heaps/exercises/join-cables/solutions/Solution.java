import java.util.PriorityQueue;

class Solution {
    public long joinCables(int[] lengths) {
        PriorityQueue<Long> pile = new PriorityQueue<>();
        for (int length : lengths) pile.offer((long) length);
        long total = 0;
        // A joined piece goes back on the pile, since it may still be among the shortest
        while (pile.size() > 1) {
            long joined = pile.poll() + pile.poll();
            total += joined;
            pile.offer(joined);
        }
        return total;
    }
}
