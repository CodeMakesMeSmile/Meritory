#include <stdlib.h>
#include <string.h>

// One different word and how many times it was searched
typedef struct {
    char* word;
    int count;
} Entry;

// True when a is the weaker word: fewer searches, or the same and later in the alphabet
static int weaker(const Entry* a, const Entry* b) {
    if (a->count != b->count) return a->count < b->count;
    return strcmp(a->word, b->word) > 0;
}

// A heap with the weakest entry on top, and the children of index i at 2i + 1 and 2i + 2
typedef struct {
    Entry* items;
    int size;
} Heap;

static void heapPush(Heap* heap, Entry item) {
    Entry* items = heap->items;
    int i = heap->size++;
    items[i] = item;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (!weaker(&items[i], &items[parent])) break;
        Entry held = items[parent];
        items[parent] = items[i];
        items[i] = held;
        i = parent;
    }
}

static Entry heapPop(Heap* heap) {
    Entry* items = heap->items;
    Entry top = items[0];
    items[0] = items[--heap->size];
    int i = 0;
    while (1) {
        int left = 2 * i + 1;
        int right = left + 1;
        int first = i;
        if (left < heap->size && weaker(&items[left], &items[first])) first = left;
        if (right < heap->size && weaker(&items[right], &items[first])) first = right;
        if (first == i) break;
        Entry held = items[first];
        items[first] = items[i];
        items[i] = held;
        i = first;
    }
    return top;
}

static int compareWords(const void* a, const void* b) {
    return strcmp(*(char* const*)a, *(char* const*)b);
}

char** topSearches(char** searches, int searchesSize, int k, int* returnSize) {
    // Sorting puts copies of a word side by side, so each run is one word's count
    char** sorted = malloc(sizeof(char*) * searchesSize);
    memcpy(sorted, searches, sizeof(char*) * searchesSize);
    qsort(sorted, searchesSize, sizeof(char*), compareWords);
    // One spare slot, since a push can briefly make it k + 1
    Heap best = {.items = malloc(sizeof(Entry) * (k + 1)), .size = 0};
    int start = 0;
    while (start < searchesSize) {
        int end = start;
        while (end < searchesSize && strcmp(sorted[end], sorted[start]) == 0) end++;
        heapPush(&best, (Entry){sorted[start], end - start});
        if (best.size > k) heapPop(&best);
        start = end;
    }
    // The heap gives them up weakest first, so fill the answer from the back
    *returnSize = best.size;
    char** top = malloc(sizeof(char*) * best.size);
    for (int i = *returnSize - 1; i >= 0; i--) top[i] = heapPop(&best).word;
    free(sorted);
    free(best.items);
    return top;
}
