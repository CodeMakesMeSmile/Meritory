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
        // Every later stamp is worth at least as much, so none of them fit either
        if (sorted[i] > left) break;
        path[size] = sorted[i];
        // Starting at i again lets the same value be used more than once
        build(sorted, n, i, left - sorted[i], path, size + 1, found);
    }
}

int** stampSets(int* values, int valuesSize, int postage, int* returnSize, int** returnColumnSizes) {
    int* sorted = malloc(sizeof(int) * valuesSize);
    memcpy(sorted, values, sizeof(int) * valuesSize);
    qsort(sorted, valuesSize, sizeof(int), compareInts);
    Found found = {malloc(sizeof(int*) * 16), malloc(sizeof(int) * 16), 0, 16};
    // A set has at most postage stamps, since each is worth at least 1
    int* path = malloc(sizeof(int) * postage);
    build(sorted, valuesSize, 0, postage, path, 0, &found);
    free(path);
    free(sorted);
    *returnSize = found.count;
    *returnColumnSizes = found.sizes;
    return found.lists;
}
