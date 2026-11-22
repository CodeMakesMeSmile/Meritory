int dialPosition(int factor, long long turns, int size) {
    long long m = size;
    // Starting at 1 % m makes a one-position dial start at 0
    long long position = 1 % m;
    long long square = factor % m;
    while (turns > 0) {
        // Both values are below 2^31, so each product stays below 2^62
        if (turns & 1) position = position * square % m;
        square = square * square % m;
        turns >>= 1;
    }
    return (int)position;
}
