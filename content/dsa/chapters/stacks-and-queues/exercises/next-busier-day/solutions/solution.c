#include <stdlib.h>

int* daysUntilBusier(int* visitors, int visitorsSize, int* returnSize) {
    int* wait = calloc(visitorsSize > 0 ? visitorsSize : 1, sizeof(int));
    // Days still waiting for a busier one, with counts that never rise from bottom to top
    int* waiting = malloc(sizeof(int) * (visitorsSize > 0 ? visitorsSize : 1));
    int top = 0;
    for (int day = 0; day < visitorsSize; day++) {
        while (top > 0 && visitors[waiting[top - 1]] < visitors[day]) {
            int earlier = waiting[--top];
            wait[earlier] = day - earlier;
        }
        waiting[top++] = day;
    }
    free(waiting);
    *returnSize = visitorsSize;
    return wait;
}
