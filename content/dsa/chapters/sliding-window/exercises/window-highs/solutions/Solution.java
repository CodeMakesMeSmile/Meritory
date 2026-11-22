import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int[] windowHighs(int[] prices, int k) {
        // Positions whose prices get smaller from front to back
        Deque<Integer> positions = new ArrayDeque<>();
        int[] highs = new int[prices.length - k + 1];
        for (int right = 0; right < prices.length; right++) {
            // An older price no higher than this one can never be a high again
            while (!positions.isEmpty() && prices[positions.peekLast()] <= prices[right]) {
                positions.pollLast();
            }
            positions.addLast(right);
            if (positions.peekFirst() <= right - k) {
                positions.pollFirst();
            }
            if (right >= k - 1) {
                highs[right - k + 1] = prices[positions.peekFirst()];
            }
        }
        return highs;
    }
}
