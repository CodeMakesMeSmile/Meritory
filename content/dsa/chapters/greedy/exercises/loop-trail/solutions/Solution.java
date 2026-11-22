class Solution {
    public int bestLoopStretch(int[] views) {
        int total = views[0];
        // The best and worst totals of a stretch ending at the current point, and of any stretch
        int bestHere = views[0];
        int best = views[0];
        int worstHere = views[0];
        int worst = views[0];
        for (int i = 1; i < views.length; i++) {
            int score = views[i];
            total += score;
            bestHere = Math.max(score, bestHere + score);
            best = Math.max(best, bestHere);
            worstHere = Math.min(score, worstHere + score);
            worst = Math.min(worst, worstHere);
        }
        // Every score is negative, so leaving out the worst stretch would leave nothing
        if (best < 0) return best;
        // A stretch that wraps is the whole loop without one stretch in the middle
        return Math.max(best, total - worst);
    }
}
