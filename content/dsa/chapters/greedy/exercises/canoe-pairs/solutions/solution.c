#include <stdlib.h>
#include <string.h>

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

int fewestCanoes(int* weights, int weightsSize, int limit) {
    // Sort a copy, so the input is left as it was
    int* sorted = malloc(sizeof(int) * weightsSize);
    memcpy(sorted, weights, sizeof(int) * weightsSize);
    qsort(sorted, weightsSize, sizeof(int), compareInts);
    int light = 0;
    int heavy = weightsSize - 1;
    int canoes = 0;
    while (light <= heavy) {
        // The heaviest camper needs a canoe, and if anyone fits with them, the lightest does
        if (sorted[light] + sorted[heavy] <= limit) light++;
        heavy--;
        canoes++;
    }
    free(sorted);
    return canoes;
}
