#include <stdlib.h>

// One oven's front: its minute, which oven it's from, and its position there
typedef struct {
    int minute;
    int oven;
    int at;
} Front;

// A min-heap of fronts by minute, with the children of index i at 2i + 1 and 2i + 2
typedef struct {
    Front* items;
    int size;
} Heap;

static void heapPush(Heap* heap, Front item) {
    Front* items = heap->items;
    int i = heap->size++;
    items[i] = item;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (items[parent].minute <= items[i].minute) break;
        Front held = items[parent];
        items[parent] = items[i];
        items[i] = held;
        i = parent;
    }
}

static Front heapPop(Heap* heap) {
    Front* items = heap->items;
    Front top = items[0];
    items[0] = items[--heap->size];
    int i = 0;
    while (1) {
        int left = 2 * i + 1;
        int right = left + 1;
        int smallest = i;
        if (left < heap->size && items[left].minute < items[smallest].minute) smallest = left;
        if (right < heap->size && items[right].minute < items[smallest].minute) smallest = right;
        if (smallest == i) break;
        Front held = items[smallest];
        items[smallest] = items[i];
        items[i] = held;
        i = smallest;
    }
    return top;
}

int kthLoaf(int** ovens, int ovensSize, int* ovensColSize, int k) {
    // The heap holds at most one front per oven
    Heap fronts = {.items = malloc(sizeof(Front) * ovensSize), .size = 0};
    for (int o = 0; o < ovensSize; o++) {
        if (ovensColSize[o] > 0) heapPush(&fronts, (Front){ovens[o][0], o, 0});
    }
    // Take the earliest loaf k - 1 times, and the k-th is then on top
    for (int taken = 1; taken < k; taken++) {
        Front front = heapPop(&fronts);
        int at = front.at + 1;
        if (at < ovensColSize[front.oven]) {
            heapPush(&fronts, (Front){ovens[front.oven][at], front.oven, at});
        }
    }
    int answer = fronts.items[0].minute;
    free(fronts.items);
    return answer;
}
