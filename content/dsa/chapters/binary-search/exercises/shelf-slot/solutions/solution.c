int shelfSlot(int* ids, int idsSize, int newId) {
    // Every position before lo holds a smaller number, and every one from hi on holds newId or more
    int lo = 0;
    int hi = idsSize;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (ids[mid] >= newId) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
