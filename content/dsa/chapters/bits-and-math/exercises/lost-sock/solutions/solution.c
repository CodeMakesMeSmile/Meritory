int loneSock(int* socks, int socksSize) {
    // Each pair XORs to 0, so only the lone pattern is left
    int lone = 0;
    for (int i = 0; i < socksSize; i++) lone ^= socks[i];
    return lone;
}
