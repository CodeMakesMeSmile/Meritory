#include <stdlib.h>

// One wave's front: its time, which wave it's from, and its position there
typedef struct {
    int time;
    int wave;
    int at;
} Front;

// A min-heap of fronts by time, with the children of index i at 2i + 1 and 2i + 2
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
        if (items[parent].time <= items[i].time) break;
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
        if (left < heap->size && items[left].time < items[smallest].time) smallest = left;
        if (right < heap->size && items[right].time < items[smallest].time) smallest = right;
        if (smallest == i) break;
        Front held = items[smallest];
        items[smallest] = items[i];
        items[i] = held;
        i = smallest;
    }
    return top;
}

int* mergeWaves(int** waves, int wavesSize, int* wavesColSize, int* returnSize) {
    // The heap holds at most one front per wave
    Heap fronts = {.items = malloc(sizeof(Front) * (wavesSize > 0 ? wavesSize : 1)), .size = 0};
    int total = 0;
    for (int w = 0; w < wavesSize; w++) {
        total += wavesColSize[w];
        if (wavesColSize[w] > 0) heapPush(&fronts, (Front){waves[w][0], w, 0});
    }
    int* merged = malloc(sizeof(int) * (total > 0 ? total : 1));
    *returnSize = 0;
    while (fronts.size > 0) {
        Front front = heapPop(&fronts);
        merged[(*returnSize)++] = front.time;
        // The next time in the same wave takes its place
        int at = front.at + 1;
        if (at < wavesColSize[front.wave]) {
            heapPush(&fronts, (Front){waves[front.wave][at], front.wave, at});
        }
    }
    free(fronts.items);
    return merged;
}
