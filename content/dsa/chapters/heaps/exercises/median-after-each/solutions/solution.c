#include <stdlib.h>

// A min-heap of ints, with the children of index i at 2i + 1 and 2i + 2
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

double* runningMedians(int* times, int timesSize, int* returnSize) {
    // Each heap holds at most half the times plus one, so n + 1 slots are always enough
    int room = timesSize + 1;
    // low holds the shorter half as negatives, so its longest is on top, and high holds the longer half
    Heap low = {.items = malloc(sizeof(int) * room), .size = 0};
    Heap high = {.items = malloc(sizeof(int) * room), .size = 0};
    double* medians = malloc(sizeof(double) * room);
    for (int i = 0; i < timesSize; i++) {
        // Passing each time through low keeps every value in low at most every value in high
        heapPush(&low, -times[i]);
        heapPush(&high, -heapPop(&low));
        // Keep low the same size as high, or one bigger
        if (high.size > low.size) heapPush(&low, -heapPop(&high));
        double middle = -low.items[0];
        medians[i] = low.size > high.size ? middle : (middle + high.items[0]) / 2.0;
    }
    *returnSize = timesSize;
    free(low.items);
    free(high.items);
    return medians;
}
