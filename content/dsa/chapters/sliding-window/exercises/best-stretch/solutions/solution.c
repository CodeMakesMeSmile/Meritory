int bestStretch(int* sales, int salesSize, int k) {
    int total = 0;
    int best = 0;
    for (int right = 0; right < salesSize; right++) {
        total += sales[right];
        // Once the window is full, the day k back leaves as this one enters
        if (right >= k) total -= sales[right - k];
        if (right >= k - 1 && total > best) best = total;
    }
    return best;
}
