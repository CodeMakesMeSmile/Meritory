int giftsUnderBudget(int* prices, int pricesSize, int budget) {
    int best = -1;
    int left = 0;
    int right = pricesSize - 1;
    while (left < right) {
        int total = prices[left] + prices[right];
        if (total <= budget) {
            // This is the best the left gift can do, so record it and move on
            if (total > best) best = total;
            left++;
        } else {
            right--;
        }
    }
    return best;
}
