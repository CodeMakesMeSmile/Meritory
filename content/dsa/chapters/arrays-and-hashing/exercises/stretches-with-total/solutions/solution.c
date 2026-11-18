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

static void addOne(Table* table, int key) {
    int slot = tableSlot(table, key);
    if (!table->used[slot]) {
        table->used[slot] = true;
        table->keys[slot] = key;
        table->values[slot] = 0;
    }
    table->values[slot]++;
}

long long stretchesWithTotal(int* changes, int changesSize, int total) {
    Table seen = tableCreate(changesSize + 1);
    addOne(&seen, 0);
    int sum = 0;
    long long stretches = 0;
    for (int i = 0; i < changesSize; i++) {
        sum += changes[i];
        int slot = tableSlot(&seen, sum - total);
        if (seen.used[slot]) stretches += seen.values[slot];
        addOne(&seen, sum);
    }
    tableFree(&seen);
    return stretches;
}
