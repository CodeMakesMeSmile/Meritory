class Solution {
    public int firstFailing(boolean[] builds) {
        // Every build before lo passed, and every build from hi on failed
        int lo = 0;
        int hi = builds.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (!builds[mid]) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
