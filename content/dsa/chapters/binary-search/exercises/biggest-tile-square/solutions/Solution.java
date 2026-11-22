class Solution {
    public int biggestSquare(int tiles) {
        // Longs, since tiles + 1 and mid * mid can pass the int limit
        long lo = 0;
        long hi = (long) tiles + 1;
        // Find the first side whose square needs more than tiles, then step back one
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (mid * mid > tiles) hi = mid;
            else lo = mid + 1;
        }
        return (int) (lo - 1);
    }
}
