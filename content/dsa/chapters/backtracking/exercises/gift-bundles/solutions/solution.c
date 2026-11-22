#include <stdlib.h>
#include <string.h>

typedef struct {
    int** lists;
    int* sizes;
    int count;
} Found;

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

// path[0] to path[size - 1] holds the bundle being built
static void build(int* sorted, int n, int start, int* path, int size, Found* found) {
    int* bundle = malloc(sizeof(int) * (size > 0 ? size : 1));
    memcpy(bundle, path, sizeof(int) * size);
    found->lists[found->count] = bundle;
    found->sizes[found->count++] = size;
    for (int i = start; i < n; i++) {
        // A second branch at this level with the same price would repeat the first
        if (i > start && sorted[i] == sorted[i - 1]) continue;
        path[size] = sorted[i];
        build(sorted, n, i + 1, path, size + 1, found);
    }
}

int** giftBundles(int* prices, int pricesSize, int* returnSize, int** returnColumnSizes) {
    // Sorting puts equal prices side by side and keeps each bundle in order
    int room = pricesSize > 0 ? pricesSize : 1;
    int* sorted = malloc(sizeof(int) * room);
    memcpy(sorted, prices, sizeof(int) * pricesSize);
    qsort(sorted, pricesSize, sizeof(int), compareInts);
    // There are never more bundles than the 2^n sets of positions
    int total = 1 << pricesSize;
    Found found = {malloc(sizeof(int*) * total), malloc(sizeof(int) * total), 0};
    int* path = malloc(sizeof(int) * room);
    build(sorted, pricesSize, 0, path, 0, &found);
    free(path);
    free(sorted);
    *returnSize = found.count;
    *returnColumnSizes = found.sizes;
    return found.lists;
}
