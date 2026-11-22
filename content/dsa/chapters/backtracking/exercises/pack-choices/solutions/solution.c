#include <stdlib.h>
#include <string.h>

typedef struct {
    int** sets;
    int* sizes;
    int count;
} Found;

// path[0] to path[size - 1] holds the set being built
static void build(int* items, int itemsSize, int start, int* path, int size, Found* found) {
    // Every path is a set, so save a copy of each one
    int* set = malloc(sizeof(int) * (size > 0 ? size : 1));
    memcpy(set, path, sizeof(int) * size);
    found->sets[found->count] = set;
    found->sizes[found->count++] = size;
    for (int i = start; i < itemsSize; i++) {
        // The next choice at this level overwrites this one, which is the undo
        path[size] = items[i];
        // Only later items can follow, so each set is built once, in input order
        build(items, itemsSize, i + 1, path, size + 1, found);
    }
}

int** packChoices(int* items, int itemsSize, int* returnSize, int** returnColumnSizes) {
    // n items have exactly 2^n sets
    int total = 1 << itemsSize;
    Found found = {malloc(sizeof(int*) * total), malloc(sizeof(int) * total), 0};
    int* path = malloc(sizeof(int) * (itemsSize > 0 ? itemsSize : 1));
    build(items, itemsSize, 0, path, 0, &found);
    free(path);
    *returnSize = found.count;
    *returnColumnSizes = found.sizes;
    return found.sets;
}
