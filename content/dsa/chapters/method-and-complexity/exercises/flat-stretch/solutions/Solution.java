class Solution {
    public int flatStretch(int[] levels) {
        if (levels.length == 0) {
            return 0;
        }
        int best = 1;
        int run = 1;
        for (int i = 1; i < levels.length; i++) {
            run = levels[i] == levels[i - 1] ? run + 1 : 1;
            // Check on every step, so a stretch that reaches the end still counts
            best = Math.max(best, run);
        }
        return best;
    }
}
