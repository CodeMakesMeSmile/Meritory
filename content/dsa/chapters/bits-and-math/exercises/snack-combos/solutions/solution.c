int snackCombos(int* prices, int pricesSize, int budget) {
    int ways = 0;
    // Each mask from 1 up is a different non-empty group, with bit i meaning snack i is in
    for (int mask = 1; mask < 1 << pricesSize; mask++) {
        int total = 0;
        for (int i = 0; i < pricesSize; i++) {
            if ((mask >> i) & 1) total += prices[i];
        }
        if (total == budget) ways++;
    }
    return ways;
}
