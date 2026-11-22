class Solution {
    public int[] bookingRange(int[] days, int day) {
        int start = firstAtLeast(days, day);
        if (start == days.length || days[start] != day) return new int[] {-1, -1};
        // The first booking on a later day sits just past the last booking on this one
        int end = firstAtLeast(days, day + 1);
        return new int[] {start, end - 1};
    }

    private int firstAtLeast(int[] days, int target) {
        int lo = 0;
        int hi = days.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (days[mid] >= target) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
