class Solution {
    public int bestTakings(int[] weights, int[] takings, int capacity) {
        // best[w] is the most takings from the crates so far, weighing at most w
        int[] best = new int[capacity + 1];
        for (int i = 0; i < weights.length; i++) {
            // Going down keeps best[w - weights[i]] from before this crate, so it's packed once
            for (int w = capacity; w >= weights[i]; w--) {
                best[w] = Math.max(best[w], best[w - weights[i]] + takings[i]);
            }
        }
        return best[capacity];
    }
}
