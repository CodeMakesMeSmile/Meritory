class Solution {
    public int mismatchedBits(int first, int second) {
        // A bit of the XOR is 1 exactly where the readings differ
        int diff = first ^ second;
        int count = 0;
        while (diff != 0) {
            // Clears the lowest set bit, and int arithmetic wraps within 32 bits
            diff &= diff - 1;
            count++;
        }
        return count;
    }
}
