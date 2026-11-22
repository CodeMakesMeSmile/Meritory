class Solution {
    public int giftsUnderBudget(int[] prices, int budget) {
        int best = -1;
        int left = 0;
        int right = prices.length - 1;
        while (left < right) {
            int total = prices[left] + prices[right];
            if (total <= budget) {
                // This is the best the left gift can do, so record it and move on
                best = Math.max(best, total);
                left++;
            } else {
                right--;
            }
        }
        return best;
    }
}
