#include <stdlib.h>
#include <string.h>

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

long long leastWaiting(int* repairs, int repairsSize) {
    // A longer repair just before a shorter one is always worth swapping, so go shortest first
    int* quickest = malloc(sizeof(int) * (repairsSize > 0 ? repairsSize : 1));
    memcpy(quickest, repairs, sizeof(int) * repairsSize);
    qsort(quickest, repairsSize, sizeof(int), compareInts);
    long long clock = 0;
    long long total = 0;
    for (int i = 0; i < repairsSize; i++) {
        // Each customer waits until their own repair is done
        clock += quickest[i];
        total += clock;
    }
    free(quickest);
    return total;
}
