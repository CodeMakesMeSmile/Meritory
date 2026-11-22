class Solution {
    public int lastDigits(int base, long exponent, int digits) {
        long m = 1;
        for (int i = 0; i < digits; i++) {
            m *= 10;
        }
        long result = 1;
        long square = base % m;
        // Read the exponent's bits from the lowest, squaring as we go
        while (exponent > 0) {
            // Both values are below 10^9, so each product stays below 10^18
            if ((exponent & 1) == 1) {
                result = result * square % m;
            }
            square = square * square % m;
            exponent >>= 1;
        }
        return (int) (result % m);
    }
}
