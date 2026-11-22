#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    int** lists;
    int count;
} Found;

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

// path[0] to path[size - 1] holds the pattern so far
static void build(int* sorted, int n, int* path, int size, bool* used, Found* found) {
    if (size == n) {
        int* pattern = malloc(sizeof(int) * (n > 0 ? n : 1));
        memcpy(pattern, path, sizeof(int) * n);
        found->lists[found->count++] = pattern;
        return;
    }
    for (int i = 0; i < n; i++) {
        if (used[i]) continue;
        // Beads of one colour go on from left to right, so swapping them never repeats a pattern
        if (i > 0 && sorted[i] == sorted[i - 1] && !used[i - 1]) continue;
        used[i] = true;
        path[size] = sorted[i];
        build(sorted, n, path, size + 1, used, found);
        used[i] = false;
    }
}

int** beadPatterns(int* beads, int beadsSize, int* returnSize, int** returnColumnSizes) {
    int room = beadsSize > 0 ? beadsSize : 1;
    // Sorting puts beads of the same colour side by side
    int* sorted = malloc(sizeof(int) * room);
    memcpy(sorted, beads, sizeof(int) * beadsSize);
    qsort(sorted, beadsSize, sizeof(int), compareInts);
    // There are never more patterns than the n! orders of the positions
    int total = 1;
    for (int k = 2; k <= beadsSize; k++) total *= k;
    Found found = {malloc(sizeof(int*) * total), 0};
    int* path = malloc(sizeof(int) * room);
    bool* used = calloc(room, sizeof(bool));
    build(sorted, beadsSize, path, 0, used, &found);
    free(path);
    free(used);
    free(sorted);
    *returnSize = found.count;
    *returnColumnSizes = malloc(sizeof(int) * total);
    for (int i = 0; i < found.count; i++) (*returnColumnSizes)[i] = beadsSize;
    return found.lists;
}
