int findTrack(int* tracks, int tracksSize, int target) {
    int last = tracks[tracksSize - 1];
    // Find where the loop wraps, the first track no higher than the last one
    int lo = 0;
    int hi = tracksSize;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (tracks[mid] <= last) hi = mid;
        else lo = mid + 1;
    }
    int wrap = lo;
    // Tracks up to the last one sit from wrap to the end, and higher ones sit before it
    if (target <= last) {
        lo = wrap;
        hi = tracksSize;
    } else {
        lo = 0;
        hi = wrap;
    }
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (tracks[mid] >= target) hi = mid;
        else lo = mid + 1;
    }
    return lo < tracksSize && tracks[lo] == target ? lo : -1;
}
