#define MOD 1000000007LL

// The count after h hours is the count after half as many hours, squared
static long long grow(long long factor, int h) {
    if (h == 0) return 1;
    long long half = grow(factor, h / 2);
    long long squared = half * half % MOD;
    // An odd number of hours needs one more split
    return h % 2 == 0 ? squared : squared * factor % MOD;
}

int cultureSize(int factor, int hours) {
    return (int)grow(factor, hours);
}
