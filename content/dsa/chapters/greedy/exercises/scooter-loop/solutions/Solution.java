class Solution {
    public int firstStart(int[] charge, int[] drain) {
        int total = 0;
        int battery = 0;
        int start = 0;
        for (int i = 0; i < charge.length; i++) {
            int gain = charge[i] - drain[i];
            total += gain;
            battery += gain;
            // Ran out before the next dock, so no dock from start to here works either
            if (battery < 0) {
                start = i + 1;
                battery = 0;
            }
        }
        // With enough charge round the whole loop, the last start never runs out
        return total >= 0 ? start : -1;
    }
}
