class Solution {
    public int[] priceSpans(int[] prices) {
        int[] spans = new int[prices.length];
        // Earlier days that could still end a span, with prices falling from bottom to top
        int[] higher = new int[prices.length];
        int top = 0;
        for (int day = 0; day < prices.length; day++) {
            while (top > 0 && prices[higher[top - 1]] <= prices[day]) top--;
            // The day left on top is the last one with a higher price
            int stop = top > 0 ? higher[top - 1] : -1;
            spans[day] = day - stop;
            higher[top++] = day;
        }
        return spans;
    }
}
