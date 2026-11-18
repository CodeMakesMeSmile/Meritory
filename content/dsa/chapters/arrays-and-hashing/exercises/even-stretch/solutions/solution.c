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

int evenStretch(bool* games, int gamesSize) {
    // Wins minus losses so far, mapped to the first game index where it happened
    Table firstIndex = tableCreate(gamesSize + 1);
    int slot = tableSlot(&firstIndex, 0);
    firstIndex.used[slot] = true;
    firstIndex.keys[slot] = 0;
    firstIndex.values[slot] = -1;
    int balance = 0;
    int longest = 0;
    for (int i = 0; i < gamesSize; i++) {
        balance += games[i] ? 1 : -1;
        slot = tableSlot(&firstIndex, balance);
        if (firstIndex.used[slot]) {
            int length = i - firstIndex.values[slot];
            if (length > longest) longest = length;
        } else {
            firstIndex.used[slot] = true;
            firstIndex.keys[slot] = balance;
            firstIndex.values[slot] = i;
        }
    }
    tableFree(&firstIndex);
    return longest;
}
