#include <stdlib.h>

typedef struct {
    // A min-heap in an array, where the children of index i sit at 2i + 1 and 2i + 2
    int* items;
    int count;
    int capacity;
} RepairDesk;

RepairDesk* repairDeskCreate(void) {
    RepairDesk* obj = malloc(sizeof(RepairDesk));
    obj->count = 0;
    obj->capacity = 16;
    obj->items = malloc(sizeof(int) * obj->capacity);
    return obj;
}

static void swap(int* items, int a, int b) {
    int held = items[a];
    items[a] = items[b];
    items[b] = held;
}

void repairDeskAdd(RepairDesk* obj, int urgency) {
    if (obj->count == obj->capacity) {
        obj->capacity *= 2;
        obj->items = realloc(obj->items, sizeof(int) * obj->capacity);
    }
    int* items = obj->items;
    items[obj->count] = urgency;
    // Sift up: swap with the parent while the parent is less urgent
    int i = obj->count++;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (items[parent] <= items[i]) break;
        swap(items, parent, i);
        i = parent;
    }
}

int repairDeskNext(RepairDesk* obj) {
    int* items = obj->items;
    int top = items[0];
    // Move the last job to the root, then sift it down
    items[0] = items[--obj->count];
    int count = obj->count;
    int i = 0;
    while (1) {
        int left = 2 * i + 1;
        int right = left + 1;
        int smallest = i;
        if (left < count && items[left] < items[smallest]) smallest = left;
        if (right < count && items[right] < items[smallest]) smallest = right;
        if (smallest == i) break;
        swap(items, smallest, i);
        i = smallest;
    }
    return top;
}

int repairDeskPeek(RepairDesk* obj) {
    return obj->items[0];
}

int repairDeskSize(RepairDesk* obj) {
    return obj->count;
}

void repairDeskFree(RepairDesk* obj) {
    free(obj->items);
    free(obj);
}
