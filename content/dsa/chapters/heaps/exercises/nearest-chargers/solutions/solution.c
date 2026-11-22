#include <stdlib.h>

// The squared distance orders chargers the same way, with no square root
static int distance(const int* p) {
    return p[0] * p[0] + p[1] * p[1];
}

// A max-heap of chargers by distance, with the children of index i at 2i + 1 and 2i + 2
typedef struct {
    int** items;
    int size;
} Heap;

static void heapPush(Heap* heap, int* item) {
    int** items = heap->items;
    int i = heap->size++;
    items[i] = item;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (distance(items[parent]) >= distance(items[i])) break;
        int* held = items[parent];
        items[parent] = items[i];
        items[i] = held;
        i = parent;
    }
}

static int* heapPop(Heap* heap) {
    int** items = heap->items;
    int* top = items[0];
    items[0] = items[--heap->size];
    int i = 0;
    while (1) {
        int left = 2 * i + 1;
        int right = left + 1;
        int largest = i;
        if (left < heap->size && distance(items[left]) > distance(items[largest])) largest = left;
        if (right < heap->size && distance(items[right]) > distance(items[largest])) largest = right;
        if (largest == i) break;
        int* held = items[largest];
        items[largest] = items[i];
        items[i] = held;
        i = largest;
    }
    return top;
}

int** nearestChargers(int** chargers, int chargersSize, int* chargersColSize, int k, int* returnSize, int** returnColumnSizes) {
    // One spare slot, since a push can briefly make it k + 1
    Heap nearest = {.items = malloc(sizeof(int*) * (k + 1)), .size = 0};
    for (int i = 0; i < chargersSize; i++) {
        // The farthest of the k nearest so far sits on top, ready to be pushed out
        heapPush(&nearest, chargers[i]);
        if (nearest.size > k) heapPop(&nearest);
    }
    *returnSize = nearest.size;
    int** answer = malloc(sizeof(int*) * nearest.size);
    *returnColumnSizes = malloc(sizeof(int) * nearest.size);
    for (int i = 0; i < nearest.size; i++) {
        answer[i] = malloc(sizeof(int) * 2);
        answer[i][0] = nearest.items[i][0];
        answer[i][1] = nearest.items[i][1];
        (*returnColumnSizes)[i] = 2;
    }
    free(nearest.items);
    return answer;
}
