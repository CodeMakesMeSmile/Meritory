#include <limits.h>
#include <stdlib.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

// One heap entry: the earliest hour found for a cell, and which cell
typedef struct {
    int hour;
    int cell;
} Entry;

// A min-heap of entries by hour, with the children of index i at 2i + 1 and 2i + 2
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
        if (items[parent].hour <= items[i].hour) break;
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
        if (left < heap->size && items[left].hour < items[smallest].hour) smallest = left;
        if (right < heap->size && items[right].hour < items[smallest].hour) smallest = right;
        if (smallest == i) break;
        Entry held = items[smallest];
        items[smallest] = items[i];
        items[i] = held;
        i = smallest;
    }
    return top;
}

int earliestHour(int** field, int fieldSize, int* fieldColSize) {
    int rows = fieldSize;
    int cols = fieldColSize[0];
    int cells = rows * cols;
    // Cell (r, c) is number r * cols + c, and hour holds the earliest the boat can be there so far
    int* hour = malloc(sizeof(int) * cells);
    for (int i = 0; i < cells; i++) hour[i] = INT_MAX;
    // The boat needs water in the starting cell too
    hour[0] = field[0][0];
    // Each cell relaxes its 4 neighbours once, so there are at most 4 * cells + 1 pushes
    Heap heap = {.items = malloc(sizeof(Entry) * (4 * cells + 1)), .size = 0};
    heapPush(&heap, (Entry){hour[0], 0});
    while (heap.size > 0) {
        Entry entry = heapPop(&heap);
        // A stale entry, since this cell was already settled at an earlier hour
        if (entry.hour > hour[entry.cell]) continue;
        // The first time the far corner comes out, its hour is final
        if (entry.cell == cells - 1) break;
        int row = entry.cell / cols;
        int col = entry.cell % cols;
        for (int s = 0; s < 4; s++) {
            int nr = row + STEPS[s][0];
            int nc = col + STEPS[s][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            // The wait is set by the highest cell on the way, so take the larger instead of adding
            int through = entry.hour > field[nr][nc] ? entry.hour : field[nr][nc];
            int next = nr * cols + nc;
            if (through < hour[next]) {
                hour[next] = through;
                heapPush(&heap, (Entry){through, next});
            }
        }
    }
    int answer = hour[cells - 1];
    free(hour);
    free(heap.items);
    return answer;
}
