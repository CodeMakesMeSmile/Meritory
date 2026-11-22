#include <stdlib.h>

// A max-heap of bake times, with the children of index i at 2i + 1 and 2i + 2
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
        if (items[parent] >= items[i]) break;
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
        int largest = i;
        if (left < heap->size && items[left] > items[largest]) largest = left;
        if (right < heap->size && items[right] > items[largest]) largest = right;
        if (largest == i) break;
        int held = items[largest];
        items[largest] = items[i];
        items[i] = held;
        i = largest;
    }
    return top;
}

static int compareDue(const void* a, const void* b) {
    int x = (*(int* const*)a)[1];
    int y = (*(int* const*)b)[1];
    return (x > y) - (x < y);
}

int mostOnTime(int** orders, int ordersSize, int* ordersColSize) {
    int room = ordersSize > 0 ? ordersSize : 1;
    // Sort pointers to the orders, so the input is left as it was
    int** byDue = malloc(sizeof(int*) * room);
    for (int i = 0; i < ordersSize; i++) byDue[i] = orders[i];
    qsort(byDue, ordersSize, sizeof(int*), compareDue);
    // The bake times of the orders taken so far, with the longest on top
    Heap taken = {.items = malloc(sizeof(int) * room), .size = 0};
    int finish = 0;
    for (int i = 0; i < ordersSize; i++) {
        heapPush(&taken, byDue[i][0]);
        finish += byDue[i][0];
        // Too late, so drop the longest bake taken, which frees the most oven time
        if (finish > byDue[i][1]) finish -= heapPop(&taken);
    }
    int answer = taken.size;
    free(byDue);
    free(taken.items);
    return answer;
}
