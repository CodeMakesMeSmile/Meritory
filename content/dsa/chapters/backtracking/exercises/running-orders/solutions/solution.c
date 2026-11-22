#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    int** lists;
    int count;
} Found;

// path[0] to path[size - 1] holds the order so far
static void build(int* acts, int n, int* path, int size, bool* used, Found* found) {
    if (size == n) {
        int* order = malloc(sizeof(int) * (n > 0 ? n : 1));
        memcpy(order, path, sizeof(int) * n);
        found->lists[found->count++] = order;
        return;
    }
    for (int i = 0; i < n; i++) {
        // Any act not yet on stage can go next
        if (used[i]) continue;
        used[i] = true;
        path[size] = acts[i];
        build(acts, n, path, size + 1, used, found);
        // The next choice overwrites path[size], so only the mark needs undoing
        used[i] = false;
    }
}

int** runningOrders(int* acts, int actsSize, int* returnSize, int** returnColumnSizes) {
    // n different acts have exactly n! orders
    int total = 1;
    for (int k = 2; k <= actsSize; k++) total *= k;
    Found found = {malloc(sizeof(int*) * total), 0};
    int room = actsSize > 0 ? actsSize : 1;
    int* path = malloc(sizeof(int) * room);
    bool* used = calloc(room, sizeof(bool));
    build(acts, actsSize, path, 0, used, &found);
    free(path);
    free(used);
    *returnSize = found.count;
    *returnColumnSizes = malloc(sizeof(int) * total);
    for (int i = 0; i < total; i++) (*returnColumnSizes)[i] = actsSize;
    return found.lists;
}
