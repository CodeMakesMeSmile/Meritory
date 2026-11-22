int bestShiftPay(int* pay, int paySize) {
    // The best pay from every shift but the last one seen, and from all of them
    int before = 0;
    int best = 0;
    for (int i = 0; i < paySize; i++) {
        // Skip this shift, or take it on top of the best from two shifts back
        int take = before + pay[i];
        int next = take > best ? take : best;
        before = best;
        best = next;
    }
    return best;
}
