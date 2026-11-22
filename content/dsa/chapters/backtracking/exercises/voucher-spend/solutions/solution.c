#include <stdlib.h>
#include <string.h>

typedef struct {
    int** lists;
    int* sizes;
    int count;
    int capacity;
} Found;

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

// Saves a copy of path[0] to path[size - 1], doubling the room when it's full
static void save(Found* found, int* path, int size) {
    if (found->count == found->capacity) {
        found->capacity *= 2;
        found->lists = realloc(found->lists, sizeof(int*) * found->capacity);
        found->sizes = realloc(found->sizes, sizeof(int) * found->capacity);
    }
    int* copy = malloc(sizeof(int) * (size > 0 ? size : 1));
    memcpy(copy, path, sizeof(int) * size);
    found->lists[found->count] = copy;
    found->sizes[found->count++] = size;
}

static void build(int* sorted, int n, int start, int left, int* path, int size, Found* found) {
    if (left == 0) {
        save(found, path, size);
        return;
    }
    for (int i = start; i < n; i++) {
        // Every later price is at least as high, so none of them fit either
        if (sorted[i] > left) break;
        // A second branch at this level with the same price would repeat the first
        if (i > start && sorted[i] == sorted[i - 1]) continue;
        path[size] = sorted[i];
        // Starting after i uses each item at most once
        build(sorted, n, i + 1, left - sorted[i], path, size + 1, found);
    }
}

int** voucherBaskets(int* prices, int pricesSize, int voucher, int* returnSize, int** returnColumnSizes) {
    // Sorting puts equal prices side by side and keeps each basket in order
    int* sorted = malloc(sizeof(int) * pricesSize);
    memcpy(sorted, prices, sizeof(int) * pricesSize);
    qsort(sorted, pricesSize, sizeof(int), compareInts);
    Found found = {malloc(sizeof(int*) * 16), malloc(sizeof(int) * 16), 0, 16};
    int* path = malloc(sizeof(int) * pricesSize);
    build(sorted, pricesSize, 0, voucher, path, 0, &found);
    free(path);
    free(sorted);
    *returnSize = found.count;
    *returnColumnSizes = found.sizes;
    return found.lists;
}
