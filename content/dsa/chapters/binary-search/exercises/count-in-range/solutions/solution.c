static int firstAtLeast(int* readings, int readingsSize, int target) {
    int lo = 0;
    int hi = readingsSize;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (readings[mid] >= target) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

int countBetween(int* readings, int readingsSize, int low, int high) {
    if (low > high) return 0;
    // Readings in range run from the first at least low to just before the first above high
    return firstAtLeast(readings, readingsSize, high + 1) - firstAtLeast(readings, readingsSize, low);
}
