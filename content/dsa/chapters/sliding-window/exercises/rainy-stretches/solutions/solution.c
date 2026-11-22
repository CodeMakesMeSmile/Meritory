#include <stdbool.h>

// Counts the stretches with at most k rainy days
static long long atMost(bool* rainy, int rainySize, int k) {
    if (k < 0) return 0;
    int wet = 0;
    long long stretches = 0;
    int left = 0;
    for (int right = 0; right < rainySize; right++) {
        if (rainy[right]) wet++;
        while (wet > k) {
            if (rainy[left]) wet--;
            left++;
        }
        // Every start from left to right gives a stretch with at most k rainy days
        stretches += right - left + 1;
    }
    return stretches;
}

long long rainyStretches(bool* rainy, int rainySize, int k) {
    return atMost(rainy, rainySize, k) - atMost(rainy, rainySize, k - 1);
}
