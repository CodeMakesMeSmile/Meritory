import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int steadyStretch(int[] temperatures, int limit) {
        // Positions with readings falling from front to back, so the front is the highest
        Deque<Integer> highs = new ArrayDeque<>();
        // Positions with readings rising from front to back, so the front is the lowest
        Deque<Integer> lows = new ArrayDeque<>();
        int longest = 0;
        int left = 0;
        for (int right = 0; right < temperatures.length; right++) {
            int reading = temperatures[right];
            while (!highs.isEmpty() && temperatures[highs.peekLast()] <= reading) {
                highs.pollLast();
            }
            highs.addLast(right);
            while (!lows.isEmpty() && temperatures[lows.peekLast()] >= reading) {
                lows.pollLast();
            }
            lows.addLast(right);
            // Shrink until the highest and lowest readings are close enough
            while (temperatures[highs.peekFirst()] - temperatures[lows.peekFirst()] > limit) {
                left++;
                if (highs.peekFirst() < left) {
                    highs.pollFirst();
                }
                if (lows.peekFirst() < left) {
                    lows.pollFirst();
                }
            }
            longest = Math.max(longest, right - left + 1);
        }
        return longest;
    }
}
