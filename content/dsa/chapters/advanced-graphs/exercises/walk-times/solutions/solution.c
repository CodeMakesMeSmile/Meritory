#include <limits.h>
#include <stdlib.h>

// One heap entry: the minutes to walk to a stall, and which stall
typedef struct {
    int time;
    int stall;
} Entry;

// A min-heap of entries by time, with the children of index i at 2i + 1 and 2i + 2
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
        if (items[parent].time <= items[i].time) break;
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
        int smallest = i;
        if (left < heap->size && items[left].time < items[smallest].time) smallest = left;
        if (right < heap->size && items[right].time < items[smallest].time) smallest = right;
        if (smallest == i) break;
        Entry held = items[smallest];
        items[smallest] = items[i];
        items[i] = held;
        i = smallest;
    }
    return top;
}

int* walkTimes(int n, int** paths, int pathsSize, int* pathsColSize, int start, int* returnSize) {
    // Footpaths go both ways, so each is listed under both stalls
    int ends = 2 * pathsSize;
    // The adjacency list as one array: stall i's paths run from first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    for (int i = 0; i < pathsSize; i++) {
        first[paths[i][0] + 1]++;
        first[paths[i][1] + 1]++;
    }
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    int* to = malloc(sizeof(int) * (ends > 0 ? ends : 1));
    int* minutes = malloc(sizeof(int) * (ends > 0 ? ends : 1));
    for (int i = 0; i < pathsSize; i++) {
        int a = paths[i][0];
        int b = paths[i][1];
        to[fill[a]] = b;
        minutes[fill[a]++] = paths[i][2];
        to[fill[b]] = a;
        minutes[fill[b]++] = paths[i][2];
    }
    int* time = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) time[i] = INT_MAX;
    time[start] = 0;
    // Each stall relaxes its paths once, so there are at most ends + 1 pushes
    Heap heap = {.items = malloc(sizeof(Entry) * (ends + 1)), .size = 0};
    heapPush(&heap, (Entry){0, start});
    while (heap.size > 0) {
        Entry entry = heapPop(&heap);
        // A stale entry, since this stall was already settled by a quicker walk
        if (entry.time > time[entry.stall]) continue;
        for (int j = first[entry.stall]; j < first[entry.stall + 1]; j++) {
            int next = to[j];
            if (entry.time + minutes[j] < time[next]) {
                time[next] = entry.time + minutes[j];
                heapPush(&heap, (Entry){time[next], next});
            }
        }
    }
    for (int i = 0; i < n; i++) {
        if (time[i] == INT_MAX) time[i] = -1;
    }
    free(first);
    free(fill);
    free(to);
    free(minutes);
    free(heap.items);
    *returnSize = n;
    return time;
}
