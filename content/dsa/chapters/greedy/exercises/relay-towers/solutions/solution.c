int fewestRelays(int* power, int powerSize) {
    int last = powerSize - 1;
    int relays = 0;
    // Every tower up to roundEnd can get the message in this many relays
    int roundEnd = 0;
    // The farthest tower one more relay can reach
    int farthest = 0;
    for (int i = 0; i < last; i++) {
        if (i + power[i] > farthest) farthest = i + power[i];
        if (i == roundEnd) {
            // No tower in this round sends any further, so the message is stuck
            if (farthest <= i) return -1;
            relays++;
            roundEnd = farthest;
            if (roundEnd >= last) break;
        }
    }
    return relays;
}
