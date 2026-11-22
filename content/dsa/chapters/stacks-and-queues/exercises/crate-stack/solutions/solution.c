#include <stdlib.h>

typedef struct {
    int* weights;
    // lightestSoFar[i] is the lightest weight from the bottom up to crate i
    int* lightestSoFar;
    int size;
    int capacity;
} CrateStack;

CrateStack* crateStackCreate(void) {
    CrateStack* obj = malloc(sizeof(CrateStack));
    obj->size = 0;
    obj->capacity = 16;
    obj->weights = malloc(sizeof(int) * obj->capacity);
    obj->lightestSoFar = malloc(sizeof(int) * obj->capacity);
    return obj;
}

void crateStackPush(CrateStack* obj, int weight) {
    // Doubling when full keeps each push O(1) on average
    if (obj->size == obj->capacity) {
        obj->capacity *= 2;
        obj->weights = realloc(obj->weights, sizeof(int) * obj->capacity);
        obj->lightestSoFar = realloc(obj->lightestSoFar, sizeof(int) * obj->capacity);
    }
    int below = obj->size > 0 ? obj->lightestSoFar[obj->size - 1] : weight;
    obj->weights[obj->size] = weight;
    obj->lightestSoFar[obj->size] = weight < below ? weight : below;
    obj->size++;
}

int crateStackPop(CrateStack* obj) {
    obj->size--;
    return obj->weights[obj->size];
}

int crateStackTop(CrateStack* obj) {
    return obj->weights[obj->size - 1];
}

int crateStackLightest(CrateStack* obj) {
    return obj->lightestSoFar[obj->size - 1];
}

void crateStackFree(CrateStack* obj) {
    free(obj->weights);
    free(obj->lightestSoFar);
    free(obj);
}
