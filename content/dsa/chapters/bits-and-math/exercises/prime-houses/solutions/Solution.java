class Solution {
    public int primeHouses(long low, long high) {
        // Every composite in the window has a prime factor no bigger than this
        int root = (int) Math.sqrt((double) high);
        while ((long) (root + 1) * (root + 1) <= high) {
            root++;
        }
        while ((long) root * root > high) {
            root--;
        }
        boolean[] small = new boolean[root + 1];
        boolean[] crossed = new boolean[(int) (high - low + 1)];
        for (int p = 2; p <= root; p++) {
            if (small[p]) {
                continue;
            }
            for (long q = (long) p * p; q <= root; q += p) {
                small[(int) q] = true;
            }
            // Start at p squared, or at the first multiple of p in the window
            long start = Math.max((long) p * p, (low + p - 1) / p * p);
            for (long q = start; q <= high; q += p) {
                crossed[(int) (q - low)] = true;
            }
        }
        int count = 0;
        for (int i = 0; i < crossed.length; i++) {
            // 1 isn't prime, though nothing crosses it off
            if (!crossed[i] && low + i >= 2) {
                count++;
            }
        }
        return count;
    }
}
