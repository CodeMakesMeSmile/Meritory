class Solution {
    public long rainyStretches(boolean[] rainy, int k) {
        return atMost(rainy, k) - atMost(rainy, k - 1);
    }

    private static long atMost(boolean[] rainy, int k) {
        if (k < 0) {
            return 0;
        }
        int wet = 0;
        long stretches = 0;
        int left = 0;
        for (int right = 0; right < rainy.length; right++) {
            if (rainy[right]) {
                wet++;
            }
            while (wet > k) {
                if (rainy[left]) {
                    wet--;
                }
                left++;
            }
            // Every start from left to right gives a stretch with at most k rainy days
            stretches += right - left + 1;
        }
        return stretches;
    }
}
