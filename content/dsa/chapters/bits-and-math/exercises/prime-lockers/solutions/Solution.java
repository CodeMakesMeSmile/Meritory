class Solution {
    public int primeLockers(int lockers) {
        if (lockers < 2) {
            return 0;
        }
        boolean[] composite = new boolean[lockers + 1];
        for (int p = 2; (long) p * p <= lockers; p++) {
            if (composite[p]) {
                continue;
            }
            // Smaller multiples of p were already crossed off by smaller primes
            for (int q = p * p; q <= lockers; q += p) {
                composite[q] = true;
            }
        }
        int count = 0;
        for (int i = 2; i <= lockers; i++) {
            if (!composite[i]) {
                count++;
            }
        }
        return count;
    }
}
