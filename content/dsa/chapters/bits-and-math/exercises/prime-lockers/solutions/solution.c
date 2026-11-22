#include <stdlib.h>

int primeLockers(int lockers) {
    if (lockers < 2) return 0;
    char* composite = calloc(lockers + 1, 1);
    for (int p = 2; (long long)p * p <= lockers; p++) {
        if (composite[p]) continue;
        // Smaller multiples of p were already crossed off by smaller primes
        for (int q = p * p; q <= lockers; q += p) composite[q] = 1;
    }
    int count = 0;
    for (int i = 2; i <= lockers; i++) {
        if (!composite[i]) count++;
    }
    free(composite);
    return count;
}
