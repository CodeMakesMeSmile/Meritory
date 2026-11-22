class Solution {
    private static final long MOD = 1_000_000_007L;

    public int cultureSize(int factor, int hours) {
        return (int) grow(factor, hours);
    }

    // The count after h hours is the count after half as many hours, squared
    private long grow(long factor, int h) {
        if (h == 0) return 1;
        long half = grow(factor, h / 2);
        long squared = half * half % MOD;
        // An odd number of hours needs one more split
        return h % 2 == 0 ? squared : squared * factor % MOD;
    }
}
