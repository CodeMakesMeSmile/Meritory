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

int longestRun(int* days, int daysSize) {
    Table done = tableCreate(daysSize);
    for (int i = 0; i < daysSize; i++) {
        int slot = tableSlot(&done, days[i]);
        done.used[slot] = true;
        done.keys[slot] = days[i];
        done.values[slot] = 0;
    }
    int longest = 0;
    for (int i = 0; i < daysSize; i++) {
        int slot = tableSlot(&done, days[i]);
        // A repeated day was already counted from, so skip it
        if (done.values[slot] == 1 || contains(&done, days[i] - 1)) continue;
        done.values[slot] = 1;
        int length = 1;
        while (contains(&done, days[i] + length)) length++;
        if (length > longest) longest = length;
    }
    tableFree(&done);
    return longest;
}
