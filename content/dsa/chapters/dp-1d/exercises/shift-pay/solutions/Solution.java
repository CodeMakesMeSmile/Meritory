class Solution {
    public int bestShiftPay(int[] pay) {
        // The best pay from every shift but the last one seen, and from all of them
        int before = 0;
        int best = 0;
        for (int amount : pay) {
            // Skip this shift, or take it on top of the best from two shifts back
            int next = Math.max(best, before + amount);
            before = best;
            best = next;
        }
        return best;
    }
}
