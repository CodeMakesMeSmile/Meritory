#include <stdlib.h>

int primeHouses(long long low, long long high) {
    // Every composite in the window has a prime factor no bigger than this
    // It's at most a million, so counting up to it is cheap and needs no floats
    long long root = 1;
    while ((root + 1) * (root + 1) <= high) root++;
    char* small = calloc(root + 1, 1);
    int width = (int)(high - low + 1);
    char* crossed = calloc(width, 1);
    for (long long p = 2; p <= root; p++) {
        if (small[p]) continue;
        for (long long q = p * p; q <= root; q += p) small[q] = 1;
        // Start at p squared, or at the first multiple of p in the window
        long long start = (low + p - 1) / p * p;
        if (start < p * p) start = p * p;
        for (long long q = start; q <= high; q += p) crossed[q - low] = 1;
    }
    int count = 0;
    for (int i = 0; i < width; i++) {
        // 1 isn't prime, though nothing crosses it off
        if (!crossed[i] && low + i >= 2) count++;
    }
    free(small);
    free(crossed);
    return count;
}
