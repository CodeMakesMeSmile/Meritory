class Solution {
    public int smallestVan(int[] parcels, int days) {
        int heaviest = 0;
        int total = 0;
        for (int weight : parcels) {
            heaviest = Math.max(heaviest, weight);
            total += weight;
        }
        // Every capacity before lo is too small, and every one from hi on is enough
        int lo = heaviest;
        int hi = total;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysAt(parcels, mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    // Days a capacity needs when each day takes as many parcels as fit
    private int daysAt(int[] parcels, int capacity) {
        int needed = 1;
        int load = 0;
        for (int weight : parcels) {
            if (load + weight > capacity) {
                needed++;
                load = 0;
            }
            load += weight;
        }
        return needed;
    }
}
