class Solution {
    private static final long MOD = 1_000_000_007L;

    public int songCount(String calls, String song) {
        int m = song.length();
        // ways[j] counts the ways to spell the first j notes of song from the calls so far
        long[] ways = new long[m + 1];
        ways[0] = 1;
        for (int i = 0; i < calls.length(); i++) {
            char call = calls.charAt(i);
            // Going down keeps ways[j - 1] from before this call, so each call is used once
            for (int j = m; j >= 1; j--) {
                if (song.charAt(j - 1) == call) ways[j] = (ways[j] + ways[j - 1]) % MOD;
            }
        }
        return (int) ways[m];
    }
}
