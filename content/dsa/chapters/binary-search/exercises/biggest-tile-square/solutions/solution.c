int biggestSquare(int tiles) {
    // Long longs, since tiles + 1 and mid * mid can pass the int limit
    long long lo = 0;
    long long hi = (long long)tiles + 1;
    // Find the first side whose square needs more than tiles, then step back one
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid * mid > tiles) hi = mid;
        else lo = mid + 1;
    }
    return (int)(lo - 1);
}
