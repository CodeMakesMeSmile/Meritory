#include <stdlib.h>
#include <string.h>

// Width going up, and for equal widths, height going down, so equal widths can't both be picked
static int compareBoxes(const void* a, const void* b) {
    const int* x = *(const int* const*)a;
    const int* y = *(const int* const*)b;
    if (x[0] != y[0]) return (x[0] > y[0]) - (x[0] < y[0]);
    return (y[1] > x[1]) - (y[1] < x[1]);
}

int mostNested(int** boxes, int boxesSize, int* boxesColSize) {
    // Sorts copies of the row pointers, so the input stays as it was
    int** sorted = malloc(sizeof(int*) * boxesSize);
    memcpy(sorted, boxes, sizeof(int*) * boxesSize);
    qsort(sorted, boxesSize, sizeof(int*), compareBoxes);
    // tails[k] is the lowest height that can end a stack of k + 1 boxes
    int* tails = malloc(sizeof(int) * boxesSize);
    int size = 0;
    for (int i = 0; i < boxesSize; i++) {
        int height = sorted[i][1];
        int lo = 0;
        int hi = size;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (tails[mid] >= height) hi = mid;
            else lo = mid + 1;
        }
        tails[lo] = height;
        if (lo == size) size++;
    }
    free(tails);
    free(sorted);
    return size;
}
