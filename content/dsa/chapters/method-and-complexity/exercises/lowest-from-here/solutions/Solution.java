class Solution {
    public int[] lowestFromHere(int[] prices) {
        int[] found = new int[prices.length];
        int count = 0;
        // Walk from the end, keeping the lowest price seen after each day
        for (int i = prices.length - 1; i >= 0; i--) {
            if (count == 0 || prices[i] < prices[found[count - 1]]) {
                found[count++] = i;
            }
        }
        // The days were found last to first, so copy them back in order
        int[] days = new int[count];
        for (int k = 0; k < count; k++) {
            days[k] = found[count - 1 - k];
        }
        return days;
    }
}
