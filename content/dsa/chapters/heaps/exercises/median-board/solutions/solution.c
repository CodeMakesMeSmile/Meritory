#include <stdlib.h>

// A min-heap of ints that doubles its space when full
typedef struct {
    int* items;
    int size;
    int capacity;
} Heap;

static void heapInit(Heap* heap) {
    heap->size = 0;
    heap->capacity = 16;
    heap->items = malloc(sizeof(int) * heap->capacity);
}

static void heapPush(Heap* heap, int item) {
    if (heap->size == heap->capacity) {
        heap->capacity *= 2;
        heap->items = realloc(heap->items, sizeof(int) * heap->capacity);
    }
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

typedef struct {
    // low holds the smaller half as negatives, so its largest is on top, and high holds the larger half
    Heap low;
    Heap high;
} MedianBoard;

MedianBoard* medianBoardCreate(void) {
    MedianBoard* obj = malloc(sizeof(MedianBoard));
    heapInit(&obj->low);
    heapInit(&obj->high);
    return obj;
}

void medianBoardRecord(MedianBoard* obj, int reading) {
    // Passing each reading through low keeps every value in low at most every value in high
    heapPush(&obj->low, -reading);
    heapPush(&obj->high, -heapPop(&obj->low));
    // Keep low the same size as high, or one bigger
    if (obj->high.size > obj->low.size) heapPush(&obj->low, -heapPop(&obj->high));
}

double medianBoardMedian(MedianBoard* obj) {
    double middle = -obj->low.items[0];
    if (obj->low.size > obj->high.size) return middle;
    return (middle + obj->high.items[0]) / 2.0;
}

void medianBoardFree(MedianBoard* obj) {
    free(obj->low.items);
    free(obj->high.items);
    free(obj);
}
