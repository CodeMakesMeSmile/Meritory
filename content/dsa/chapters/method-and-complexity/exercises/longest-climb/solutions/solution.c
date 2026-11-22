int longestClimb(int* heights, int heightsSize) {
    if (heightsSize == 0) return 0;
    int best = 1;
    int run = 1;
    for (int i = 1; i < heightsSize; i++) {
        run = heights[i] > heights[i - 1] ? run + 1 : 1;
        // Check on every step, so a climb that reaches the end still counts
        if (run > best) best = run;
    }
    return best;
}
