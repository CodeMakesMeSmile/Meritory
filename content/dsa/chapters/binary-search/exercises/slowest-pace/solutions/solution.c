// Hours a pace needs, kept in a long long since slow paces can pass 2^31 hours
static long long hoursAt(int* chapters, int chaptersSize, int pace) {
    long long total = 0;
    for (int i = 0; i < chaptersSize; i++) {
        // Rounds up without adding pace to pages, which could pass the int limit
        total += (chapters[i] - 1) / pace + 1;
    }
    return total;
}

int slowestPace(int* chapters, int chaptersSize, int hours) {
    int longest = 0;
    for (int i = 0; i < chaptersSize; i++) {
        if (chapters[i] > longest) longest = chapters[i];
    }
    // Every pace before lo is too slow, and every pace from hi on finishes in time
    int lo = 1;
    int hi = longest;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (hoursAt(chapters, chaptersSize, mid) <= hours) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
