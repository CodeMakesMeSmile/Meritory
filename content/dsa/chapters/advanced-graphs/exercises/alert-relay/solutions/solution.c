#include <limits.h>
#include <stdlib.h>

// One heap entry: when the alert reaches a relay, and which relay
typedef struct {
    int time;
    int relay;
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

int alertTime(int n, int** links, int linksSize, int* linksColSize, int start) {
    // The adjacency list as one array: relay i sends along links first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    for (int i = 0; i < linksSize; i++) first[links[i][0] + 1]++;
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    // Links only go one way, so each is listed under the relay that sends it
    int* to = malloc(sizeof(int) * (linksSize > 0 ? linksSize : 1));
    int* delay = malloc(sizeof(int) * (linksSize > 0 ? linksSize : 1));
    for (int i = 0; i < linksSize; i++) {
        int slot = fill[links[i][0]]++;
        to[slot] = links[i][1];
        delay[slot] = links[i][2];
    }
    int* time = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) time[i] = INT_MAX;
    time[start] = 0;
    // Each relay relaxes its links once, so there are at most linksSize + 1 pushes
    Heap heap = {.items = malloc(sizeof(Entry) * (linksSize + 1)), .size = 0};
    heapPush(&heap, (Entry){0, start});
    while (heap.size > 0) {
        Entry entry = heapPop(&heap);
        // A stale entry, since this relay was already settled at an earlier time
        if (entry.time > time[entry.relay]) continue;
        for (int j = first[entry.relay]; j < first[entry.relay + 1]; j++) {
            int next = to[j];
            if (entry.time + delay[j] < time[next]) {
                time[next] = entry.time + delay[j];
                heapPush(&heap, (Entry){time[next], next});
            }
        }
    }
    // Every relay hears at its own earliest time, so the last one to hear sets the answer
    int last = 0;
    for (int i = 0; i < n; i++) {
        if (time[i] == INT_MAX) {
            last = -1;
            break;
        }
        if (time[i] > last) last = time[i];
    }
    free(first);
    free(fill);
    free(to);
    free(delay);
    free(time);
    free(heap.items);
    return last;
}
