// Days a capacity needs when each day takes as many parcels as fit
static int daysAt(int* parcels, int parcelsSize, int capacity) {
    int needed = 1;
    int load = 0;
    for (int i = 0; i < parcelsSize; i++) {
        if (load + parcels[i] > capacity) {
            needed++;
            load = 0;
        }
        load += parcels[i];
    }
    return needed;
}

int smallestVan(int* parcels, int parcelsSize, int days) {
    int heaviest = 0;
    int total = 0;
    for (int i = 0; i < parcelsSize; i++) {
        if (parcels[i] > heaviest) heaviest = parcels[i];
        total += parcels[i];
    }
    // Every capacity before lo is too small, and every one from hi on is enough
    int lo = heaviest;
    int hi = total;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (daysAt(parcels, parcelsSize, mid) <= days) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
