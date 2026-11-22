class Solution {
    public int brightestRing(int[] glow) {
        if (glow.length == 1) return glow[0];
        // The first and last are neighbours, so leave out one of them each time
        return Math.max(bestInRow(glow, 0, glow.length - 1), bestInRow(glow, 1, glow.length));
    }

    // The most brightness from glow[from] to glow[to - 1] in a straight row
    private int bestInRow(int[] glow, int from, int to) {
        int before = 0;
        int best = 0;
        for (int i = from; i < to; i++) {
            int next = Math.max(best, before + glow[i]);
            before = best;
            best = next;
        }
        return best;
    }
}
