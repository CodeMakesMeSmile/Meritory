#include <stdlib.h>
#include <string.h>

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

long long leastWalking(int* runners, int runnersSize, int* lockers, int lockersSize) {
    // Sort copies, so the input is left as it was
    int* people = malloc(sizeof(int) * (runnersSize > 0 ? runnersSize : 1));
    int* spots = malloc(sizeof(int) * (lockersSize > 0 ? lockersSize : 1));
    memcpy(people, runners, sizeof(int) * runnersSize);
    memcpy(spots, lockers, sizeof(int) * lockersSize);
    qsort(people, runnersSize, sizeof(int), compareInts);
    qsort(spots, lockersSize, sizeof(int), compareInts);
    long long total = 0;
    // Two walks that cross can always be uncrossed without adding distance, so pair in order
    for (int i = 0; i < runnersSize; i++) {
        long long gap = (long long)people[i] - spots[i];
        total += gap < 0 ? -gap : gap;
    }
    free(people);
    free(spots);
    return total;
}
