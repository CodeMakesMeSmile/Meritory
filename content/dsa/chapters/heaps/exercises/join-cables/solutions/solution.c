#include <stdlib.h>

// A min-heap of lengths, with the children of index i at 2i + 1 and 2i + 2
typedef struct {
    long long* items;
    int size;
} Heap;

static void heapPush(Heap* heap, long long item) {
    long long* items = heap->items;
    int i = heap->size++;
    items[i] = item;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (items[parent] <= items[i]) break;
        long long held = items[parent];
        items[parent] = items[i];
        items[i] = held;
        i = parent;
    }
}

static long long heapPop(Heap* heap) {
    long long* items = heap->items;
    long long top = items[0];
    items[0] = items[--heap->size];
    int i = 0;
    while (1) {
        int left = 2 * i + 1;
        int right = left + 1;
        int smallest = i;
        if (left < heap->size && items[left] < items[smallest]) smallest = left;
        if (right < heap->size && items[right] < items[smallest]) smallest = right;
        if (smallest == i) break;
        long long held = items[smallest];
        items[smallest] = items[i];
        items[i] = held;
        i = smallest;
    }
    return top;
}

long long joinCables(int* lengths, int lengthsSize) {
    // Each join takes two pieces off and puts one back, so n slots are enough
    Heap pile = {.items = malloc(sizeof(long long) * lengthsSize), .size = 0};
    for (int i = 0; i < lengthsSize; i++) heapPush(&pile, lengths[i]);
    long long total = 0;
    // A joined piece goes back on the pile, since it may still be among the shortest
    while (pile.size > 1) {
        long long joined = heapPop(&pile) + heapPop(&pile);
        total += joined;
        heapPush(&pile, joined);
    }
    free(pile.items);
    return total;
}
