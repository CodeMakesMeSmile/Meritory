class Solution {
    public int oldestEntry(int[] totals) {
        int last = totals[totals.length - 1];
        // Every slot before lo holds more than the last slot, and every one from hi on holds no more
        int lo = 0;
        int hi = totals.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (totals[mid] <= last) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
