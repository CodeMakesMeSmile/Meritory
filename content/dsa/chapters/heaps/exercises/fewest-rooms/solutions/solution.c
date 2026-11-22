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

static void heapPop(Heap* heap) {
    int* items = heap->items;
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
}

static int compareStarts(const void* a, const void* b) {
    int x = (*(int* const*)a)[0];
    int y = (*(int* const*)b)[0];
    return (x > y) - (x < y);
}

int fewestRooms(int** sessions, int sessionsSize, int* sessionsColSize) {
    int room = sessionsSize > 0 ? sessionsSize : 1;
    // Sort pointers to the sessions, so the input is left as it was
    int** byStart = malloc(sizeof(int*) * room);
    for (int i = 0; i < sessionsSize; i++) byStart[i] = sessions[i];
    qsort(byStart, sessionsSize, sizeof(int*), compareStarts);
    // The end time of each room's current session, with the soonest free room on top
    Heap rooms = {.items = malloc(sizeof(int) * room), .size = 0};
    for (int i = 0; i < sessionsSize; i++) {
        // Reuse the room that frees up first, if it's free by the time this starts
        if (rooms.size > 0 && rooms.items[0] <= byStart[i][0]) heapPop(&rooms);
        heapPush(&rooms, byStart[i][1]);
    }
    // A room is only ever reused, never given back, so the heap's size is the answer
    int answer = rooms.size;
    free(byStart);
    free(rooms.items);
    return answer;
}
