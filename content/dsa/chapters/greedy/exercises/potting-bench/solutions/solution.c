#include <stdlib.h>
#include <string.h>

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

int mostPotted(int* seedlings, int seedlingsSize, int* pots, int potsSize) {
    // Sort copies, so the input is left as it was
    int* needs = malloc(sizeof(int) * (seedlingsSize > 0 ? seedlingsSize : 1));
    int* sizes = malloc(sizeof(int) * (potsSize > 0 ? potsSize : 1));
    memcpy(needs, seedlings, sizeof(int) * seedlingsSize);
    memcpy(sizes, pots, sizeof(int) * potsSize);
    qsort(needs, seedlingsSize, sizeof(int), compareInts);
    qsort(sizes, potsSize, sizeof(int), compareInts);
    int potted = 0;
    for (int j = 0; j < potsSize; j++) {
        // The smallest seedling still waiting takes the smallest pot that fits it
        if (potted < seedlingsSize && sizes[j] >= needs[potted]) potted++;
    }
    free(needs);
    free(sizes);
    return potted;
}
