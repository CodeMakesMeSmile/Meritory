#include <stdlib.h>

static int compareStarts(const void* a, const void* b) {
    int x = (*(int* const*)a)[0];
    int y = (*(int* const*)b)[0];
    return (x > y) - (x < y);
}

int paintedLength(int** stretches, int stretchesSize, int* stretchesColSize) {
    // Sort pointers to the stretches, so the input is left as it was
    int** byStart = malloc(sizeof(int*) * (stretchesSize > 0 ? stretchesSize : 1));
    for (int i = 0; i < stretchesSize; i++) byStart[i] = stretches[i];
    qsort(byStart, stretchesSize, sizeof(int*), compareStarts);
    int total = 0;
    // The merged stretch being built, empty to begin with
    int groupStart = -1;
    int groupEnd = -1;
    for (int i = 0; i < stretchesSize; i++) {
        if (byStart[i][0] > groupEnd) {
            // A gap, so the stretch so far is finished
            total += groupEnd - groupStart;
            groupStart = byStart[i][0];
            groupEnd = byStart[i][1];
        } else if (byStart[i][1] > groupEnd) {
            groupEnd = byStart[i][1];
        }
    }
    free(byStart);
    return total + groupEnd - groupStart;
}
