int fullestShelf(int** shelves, int shelvesSize, int* shelvesColSize) {
    int best = -1;
    int mostFull = 0;
    for (int row = 0; row < shelvesSize; row++) {
        int* slots = shelves[row];
        // Every slot before lo is empty, and every slot from hi on is full
        int lo = 0;
        int hi = shelvesColSize[row];
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (slots[mid] == 1) hi = mid;
            else lo = mid + 1;
        }
        int full = shelvesColSize[row] - lo;
        if (full > mostFull) {
            mostFull = full;
            best = row;
        }
    }
    return best;
}
