class Solution {
    private static long gcd(long a, long b) {
        while (b != 0) {
            long rest = a % b;
            a = b;
            b = rest;
        }
        return a;
    }

    public long busMeetup(int[] gaps) {
        long meet = 1;
        for (int gap : gaps) {
            // Divide before multiplying, so nothing passes the final answer
            meet = meet / gcd(meet, gap) * gap;
        }
        return meet;
    }
}
