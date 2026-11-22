#include <limits.h>
#include <stdlib.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

// One heap entry: the gentlest strain found to a cell, and which cell
typedef struct {
    int strain;
    int cell;
} Entry;

// A min-heap of entries by strain, with the children of index i at 2i + 1 and 2i + 2
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
        if (items[parent].strain <= items[i].strain) break;
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
        if (left < heap->size && items[left].strain < items[smallest].strain) smallest = left;
        if (right < heap->size && items[right].strain < items[smallest].strain) smallest = right;
        if (smallest == i) break;
        Entry held = items[smallest];
        items[smallest] = items[i];
        items[i] = held;
        i = smallest;
    }
    return top;
}

int gentlestClimb(int** heights, int heightsSize, int* heightsColSize) {
    int rows = heightsSize;
    int cols = heightsColSize[0];
    int cells = rows * cols;
    // Cell (r, c) is number r * cols + c, and strain holds the gentlest route to it so far
    int* strain = malloc(sizeof(int) * cells);
    for (int i = 0; i < cells; i++) strain[i] = INT_MAX;
    strain[0] = 0;
    // Each cell relaxes its 4 neighbours once, so there are at most 4 * cells + 1 pushes
    Heap heap = {.items = malloc(sizeof(Entry) * (4 * cells + 1)), .size = 0};
    heapPush(&heap, (Entry){0, 0});
    while (heap.size > 0) {
        Entry entry = heapPop(&heap);
        // A stale entry, since this cell was already settled by a gentler route
        if (entry.strain > strain[entry.cell]) continue;
        // The first time the far corner comes out, its strain is final
        if (entry.cell == cells - 1) break;
        int row = entry.cell / cols;
        int col = entry.cell % cols;
        for (int s = 0; s < 4; s++) {
            int nr = row + STEPS[s][0];
            int nc = col + STEPS[s][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            // A route's strain is its hardest step, so take the larger instead of adding
            int step = abs(heights[nr][nc] - heights[row][col]);
            int through = entry.strain > step ? entry.strain : step;
            int next = nr * cols + nc;
            if (through < strain[next]) {
                strain[next] = through;
                heapPush(&heap, (Entry){through, next});
            }
        }
    }
    int answer = strain[cells - 1];
    free(strain);
    free(heap.items);
    return answer;
}
