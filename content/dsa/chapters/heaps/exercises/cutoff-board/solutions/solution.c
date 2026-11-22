#include <stdlib.h>

typedef struct {
    // A min-heap of the k best scores, with the lowest of them, the cutoff, at items[0]
    int* items;
    int size;
    int k;
} CutoffBoard;

static void heapPush(CutoffBoard* obj, int item) {
    int* items = obj->items;
    int i = obj->size++;
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

static void heapPop(CutoffBoard* obj) {
    int* items = obj->items;
    items[0] = items[--obj->size];
    int i = 0;
    while (1) {
        int left = 2 * i + 1;
        int right = left + 1;
        int smallest = i;
        if (left < obj->size && items[left] < items[smallest]) smallest = left;
        if (right < obj->size && items[right] < items[smallest]) smallest = right;
        if (smallest == i) break;
        int held = items[smallest];
        items[smallest] = items[i];
        items[i] = held;
        i = smallest;
    }
}

int cutoffBoardAdd(CutoffBoard* obj, int score) {
    heapPush(obj, score);
    if (obj->size > obj->k) heapPop(obj);
    return obj->items[0];
}

CutoffBoard* cutoffBoardCreate(int k, int* scores, int scoresSize) {
    CutoffBoard* obj = malloc(sizeof(CutoffBoard));
    // One spare slot, since a push can briefly make it k + 1
    obj->items = malloc(sizeof(int) * (k + 1));
    obj->size = 0;
    obj->k = k;
    for (int i = 0; i < scoresSize; i++) cutoffBoardAdd(obj, scores[i]);
    return obj;
}

void cutoffBoardFree(CutoffBoard* obj) {
    free(obj->items);
    free(obj);
}
