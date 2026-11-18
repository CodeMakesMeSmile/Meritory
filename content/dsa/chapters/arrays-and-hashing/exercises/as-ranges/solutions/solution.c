#include <stdbool.h>
#include <stdlib.h>

// A small open addressing table from int keys to int values
typedef struct {
    int* keys;
    int* values;
    bool* used;
    int mask;
} Table;

static Table tableCreate(int expected) {
    // Kept at most half full, so probes stay short and it never has to grow
    int capacity = 16;
    while (capacity < expected * 2) capacity *= 2;
    Table table = {
        malloc(sizeof(int) * capacity),
        malloc(sizeof(int) * capacity),
        calloc(capacity, sizeof(bool)),
        capacity - 1,
    };
    return table;
}

static unsigned hashInt(int key) {
    unsigned x = (unsigned)key;
    x ^= x >> 16;
    x *= 0x45d9f3bu;
    x ^= x >> 16;
    return x;
}

// The slot holding key, or the empty slot where it would go
static int tableSlot(Table* table, int key) {
    int slot = (int)(hashInt(key) & (unsigned)table->mask);
    while (table->used[slot] && table->keys[slot] != key) {
        slot = (slot + 1) & table->mask;
    }
    return slot;
}

static void tableFree(Table* table) {
    free(table->keys);
    free(table->values);
    free(table->used);
}

static bool contains(Table* table, int key) {
    return table->used[tableSlot(table, key)];
}

int** asRanges(int* ids, int idsSize, int* returnSize, int** returnColumnSizes) {
    Table present = tableCreate(idsSize);
    for (int i = 0; i < idsSize; i++) {
        int slot = tableSlot(&present, ids[i]);
        present.used[slot] = true;
        present.keys[slot] = ids[i];
        present.values[slot] = 0;
    }
    int** ranges = malloc(sizeof(int*) * (idsSize > 0 ? idsSize : 1));
    *returnColumnSizes = malloc(sizeof(int) * (idsSize > 0 ? idsSize : 1));
    *returnSize = 0;
    for (int i = 0; i < idsSize; i++) {
        int start = ids[i];
        int slot = tableSlot(&present, start);
        // A repeated start was already turned into a range, so skip it
        if (present.values[slot] == 1 || contains(&present, start - 1)) continue;
        present.values[slot] = 1;
        int end = start;
        while (contains(&present, end + 1)) end++;
        int* range = malloc(sizeof(int) * 2);
        range[0] = start;
        range[1] = end;
        ranges[*returnSize] = range;
        (*returnColumnSizes)[(*returnSize)++] = 2;
    }
    tableFree(&present);
    return ranges;
}
