import java.util.Arrays;

class Solution {
    public int[] nextCheaper(int[] prices) {
        int[] cheaper = new int[prices.length];
        Arrays.fill(cheaper, -1);
        // Days still waiting for a cheaper price, with prices that never fall from bottom to top
        int[] waiting = new int[prices.length];
        int top = 0;
        for (int day = 0; day < prices.length; day++) {
            while (top > 0 && prices[waiting[top - 1]] > prices[day]) {
                cheaper[waiting[--top]] = prices[day];
            }
            waiting[top++] = day;
        }
        return cheaper;
    }
}
