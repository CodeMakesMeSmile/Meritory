#include <stdlib.h>
#include <string.h>

// A small open addressing table from string keys to group numbers
typedef struct {
    char** keys;
    int* groups;
    int mask;
} Table;

static Table tableCreate(int expected) {
    // Kept at most half full, so probes stay short and it never has to grow
    int capacity = 16;
    while (capacity < expected * 2) capacity *= 2;
    Table table = {
        calloc(capacity, sizeof(char*)),
        malloc(sizeof(int) * capacity),
        capacity - 1,
    };
    return table;
}

// FNV-1a, which mixes in every character
static unsigned hashString(const char* text) {
    unsigned hash = 2166136261u;
    for (; *text; text++) {
        hash ^= (unsigned char)*text;
        hash *= 16777619u;
    }
    return hash;
}

// The slot holding key, or the empty slot where it would go
static int tableSlot(Table* table, const char* key) {
    int slot = (int)(hashString(key) & (unsigned)table->mask);
    while (table->keys[slot] && strcmp(table->keys[slot], key) != 0) {
        slot = (slot + 1) & table->mask;
    }
    return slot;
}

static void tableFree(Table* table) {
    for (int i = 0; i <= table->mask; i++) free(table->keys[i]);
    free(table->keys);
    free(table->groups);
}

static int compareChars(const void* a, const void* b) {
    return *(const char*)a - *(const char*)b;
}

// The word's letters, sorted
static char* keyFor(const char* word) {
    size_t length = strlen(word);
    char* key = malloc(length + 1);
    memcpy(key, word, length + 1);
    qsort(key, length, 1, compareChars);
    return key;
}

char*** letterGroups(char** words, int wordsSize, int* returnSize, int** returnColumnSizes) {
    char** items = words;
    int count = wordsSize;
    Table table = tableCreate(count);
    int* groupOf = malloc(sizeof(int) * (count > 0 ? count : 1));
    *returnSize = 0;
    for (int i = 0; i < count; i++) {
        char* key = keyFor(items[i]);
        int slot = tableSlot(&table, key);
        if (table.keys[slot]) {
            free(key);
        } else {
            table.keys[slot] = key;
            table.groups[slot] = (*returnSize)++;
        }
        groupOf[i] = table.groups[slot];
    }

    // A second pass sizes each group exactly, then fills it in input order
    int* sizes = calloc(*returnSize > 0 ? *returnSize : 1, sizeof(int));
    for (int i = 0; i < count; i++) sizes[groupOf[i]]++;
    char*** groups = malloc(sizeof(char**) * (*returnSize > 0 ? *returnSize : 1));
    for (int g = 0; g < *returnSize; g++) {
        groups[g] = malloc(sizeof(char*) * sizes[g]);
        sizes[g] = 0;
    }
    for (int i = 0; i < count; i++) {
        int g = groupOf[i];
        groups[g][sizes[g]++] = items[i];
    }
    *returnColumnSizes = sizes;
    free(groupOf);
    tableFree(&table);
    return groups;
}
