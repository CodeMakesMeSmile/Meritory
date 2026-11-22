int bestRun(int* profit, int profitSize) {
    // The best total of a run that ends on the current day, and the best seen anywhere
    int here = profit[0];
    int best = profit[0];
    for (int i = 1; i < profitSize; i++) {
        // A run that adds up to less than zero only drags this day down, so start again
        here = here > 0 ? here + profit[i] : profit[i];
        if (here > best) best = here;
    }
    return best;
}
