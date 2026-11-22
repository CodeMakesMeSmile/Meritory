#include <stdlib.h>

// A min-heap of scores, with the children of index i at 2i + 1 and 2i + 2
typedef struct {
    int* items;
    int size;
} Heap;

static void heapPush(Heap* heap, int item) {
    int* items = heap->items;
    int i = heap->size++;
    items[i] = item;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (items[parent] <= items[i]) break;
        int held = items[parent];
        items[parent] = items[i];
        items[i] = held;
        i = parent;
    }
}

static int heapPop(Heap* heap) {
    int* items = heap->items;
    int top = items[0];
    items[0] = items[--heap->size];
    int i = 0;
    while (1) {
        int left = 2 * i + 1;
        int right = left + 1;
        int smallest = i;
        if (left < heap->size && items[left] < items[smallest]) smallest = left;
        if (right < heap->size && items[right] < items[smallest]) smallest = right;
        if (smallest == i) break;
        int held = items[smallest];
        items[smallest] = items[i];
        items[i] = held;
        i = smallest;
    }
    return top;
}

int* topScores(int* scores, int scoresSize, int k, int* returnSize) {
    // One spare slot, since a push can briefly make it k + 1
    Heap best = {.items = malloc(sizeof(int) * (k + 1)), .size = 0};
    for (int i = 0; i < scoresSize; i++) {
        // The lowest of the k best scores so far sits on top, ready to be pushed out
        heapPush(&best, scores[i]);
        if (best.size > k) heapPop(&best);
    }
    // The heap gives them up lowest first, so fill the answer from the back
    *returnSize = best.size;
    int* top = malloc(sizeof(int) * (best.size > 0 ? best.size : 1));
    for (int i = *returnSize - 1; i >= 0; i--) top[i] = heapPop(&best);
    free(best.items);
    return top;
}
