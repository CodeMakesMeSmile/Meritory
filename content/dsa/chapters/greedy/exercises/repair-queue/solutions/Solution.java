import java.util.Arrays;

class Solution {
    public long leastWaiting(int[] repairs) {
        // A longer repair just before a shorter one is always worth swapping, so go shortest first
        int[] quickest = repairs.clone();
        Arrays.sort(quickest);
        long clock = 0;
        long total = 0;
        for (int minutes : quickest) {
            // Each customer waits until their own repair is done
            clock += minutes;
            total += clock;
        }
        return total;
    }
}
