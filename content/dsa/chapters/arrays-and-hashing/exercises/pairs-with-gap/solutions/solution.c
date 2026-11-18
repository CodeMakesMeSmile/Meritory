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

static int countOf(Table* table, int key) {
    int slot = tableSlot(table, key);
    return table->used[slot] ? table->values[slot] : 0;
}

long long pairsWithGap(int* scores, int scoresSize, int gap) {
    Table counts = tableCreate(scoresSize);
    long long pairs = 0;
    for (int i = 0; i < scoresSize; i++) {
        pairs += countOf(&counts, scores[i] - gap);
        if (gap != 0) pairs += countOf(&counts, scores[i] + gap);
        int slot = tableSlot(&counts, scores[i]);
        if (!counts.used[slot]) {
            counts.used[slot] = true;
            counts.keys[slot] = scores[i];
            counts.values[slot] = 0;
        }
        counts.values[slot]++;
    }
    tableFree(&counts);
    return pairs;
}
