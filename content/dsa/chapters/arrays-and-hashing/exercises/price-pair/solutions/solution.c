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

int* pricePair(int* prices, int pricesSize, int target, int* returnSize) {
    Table firstSeen = tableCreate(pricesSize);
    int* pair = malloc(sizeof(int) * 2);
    *returnSize = 0;
    for (int j = 0; j < pricesSize; j++) {
        int partner = tableSlot(&firstSeen, target - prices[j]);
        if (firstSeen.used[partner]) {
            pair[0] = firstSeen.values[partner];
            pair[1] = j;
            *returnSize = 2;
            break;
        }
        int slot = tableSlot(&firstSeen, prices[j]);
        if (!firstSeen.used[slot]) {
            firstSeen.used[slot] = true;
            firstSeen.keys[slot] = prices[j];
            firstSeen.values[slot] = j;
        }
    }
    tableFree(&firstSeen);
    return pair;
}
