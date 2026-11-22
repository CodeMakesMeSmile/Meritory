#include <stdlib.h>

#define MAX_KIND 100000

// Counts the stretches with at most k kinds
static long long atMost(int* sightings, int sightingsSize, int k) {
    // Kinds are numbered up to MAX_KIND, so an array of counts is the whole table
    int* counts = calloc(MAX_KIND + 1, sizeof(int));
    int kinds = 0;
    long long stretches = 0;
    int left = 0;
    for (int right = 0; right < sightingsSize; right++) {
        if (counts[sightings[right]]++ == 0) kinds++;
        while (kinds > k) {
            if (--counts[sightings[left]] == 0) kinds--;
            left++;
        }
        // Every start from left to right gives a stretch with at most k kinds
        stretches += right - left + 1;
    }
    free(counts);
    return stretches;
}

long long exactKinds(int* sightings, int sightingsSize, int k) {
    return atMost(sightings, sightingsSize, k) - atMost(sightings, sightingsSize, k - 1);
}
