long long stoneWays(int stones) {
    // Ways to reach the stone two back and the stone one back, starting at stones 0 and 1
    long long before = 1;
    long long last = 1;
    for (int i = 2; i <= stones; i++) {
        // The last hop came from one stone back or two stones back
        long long next = last + before;
        before = last;
        last = next;
    }
    return last;
}
