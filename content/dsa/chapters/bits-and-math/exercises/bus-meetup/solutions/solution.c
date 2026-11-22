static long long gcd(long long a, long long b) {
    while (b != 0) {
        long long rest = a % b;
        a = b;
        b = rest;
    }
    return a;
}

long long busMeetup(int* gaps, int gapsSize) {
    long long meet = 1;
    for (int i = 0; i < gapsSize; i++) {
        // Divide before multiplying, so nothing passes the final answer
        meet = meet / gcd(meet, gaps[i]) * gaps[i];
    }
    return meet;
}
