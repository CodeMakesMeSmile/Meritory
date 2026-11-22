class Solution {
    public int slowestPace(int[] chapters, int hours) {
        int longest = 0;
        for (int pages : chapters) longest = Math.max(longest, pages);
        // Every pace before lo is too slow, and every pace from hi on finishes in time
        int lo = 1;
        int hi = longest;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hoursAt(chapters, mid) <= hours) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    // Hours a pace needs, kept in a long since slow paces can pass 2^31 hours
    private long hoursAt(int[] chapters, int pace) {
        long total = 0;
        for (int pages : chapters) {
            // Rounds up without adding pace to pages, which could pass the int limit
            total += (pages - 1) / pace + 1;
        }
        return total;
    }
}
