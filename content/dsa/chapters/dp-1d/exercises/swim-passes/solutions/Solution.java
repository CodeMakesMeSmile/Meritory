class Solution {
    public int cheapestSwims(int[] days, int[] prices) {
        int lastDay = days[days.length - 1];
        boolean[] swims = new boolean[lastDay + 1];
        for (int day : days) swims[day] = true;
        // spent[d] is the least spent so every planned day up to day d is covered
        int[] spent = new int[lastDay + 1];
        for (int d = 1; d <= lastDay; d++) {
            if (!swims[d]) {
                // Nothing new to cover today
                spent[d] = spent[d - 1];
                continue;
            }
            // A 1, 7, or 30 day pass ending today, plus the best for the days before it
            int day = spent[d - 1] + prices[0];
            int week = spent[Math.max(0, d - 7)] + prices[1];
            int month = spent[Math.max(0, d - 30)] + prices[2];
            spent[d] = Math.min(day, Math.min(week, month));
        }
        return spent[lastDay];
    }
}
