#include <stdlib.h>

static int compareEnds(const void* a, const void* b) {
    int x = (*(int* const*)a)[1];
    int y = (*(int* const*)b)[1];
    return (x > y) - (x < y);
}

int fewestCancellations(int** talks, int talksSize, int* talksColSize) {
    // Sort pointers to the talks, so the input is left as it was
    int** byEnd = malloc(sizeof(int*) * (talksSize > 0 ? talksSize : 1));
    for (int i = 0; i < talksSize; i++) byEnd[i] = talks[i];
    qsort(byEnd, talksSize, sizeof(int*), compareEnds);
    int kept = 0;
    // The stage is free from this minute on
    int freeFrom = 0;
    for (int i = 0; i < talksSize; i++) {
        // The talk that ends first leaves the most room, so keep each one that fits
        if (byEnd[i][0] >= freeFrom) {
            kept++;
            freeFrom = byEnd[i][1];
        }
    }
    free(byEnd);
    return talksSize - kept;
}
