#include <stdlib.h>

typedef struct {
    int time;
    int change;
} Event;

// By time, and at the same time by change, so a negative change comes first
static int compareEvents(const void* a, const void* b) {
    const Event* x = a;
    const Event* y = b;
    if (x->time != y->time) return (x->time > y->time) - (x->time < y->time);
    return (x->change > y->change) - (x->change < y->change);
}

int mostAboard(int** riders, int ridersSize, int* ridersColSize) {
    Event* events = malloc(sizeof(Event) * (ridersSize > 0 ? 2 * ridersSize : 1));
    for (int i = 0; i < ridersSize; i++) {
        events[2 * i] = (Event){riders[i][0], 1};
        events[2 * i + 1] = (Event){riders[i][1], -1};
    }
    // At the same stop, riders getting off come before riders getting on
    qsort(events, 2 * ridersSize, sizeof(Event), compareEvents);
    int aboard = 0;
    int most = 0;
    for (int i = 0; i < 2 * ridersSize; i++) {
        aboard += events[i].change;
        if (aboard > most) most = aboard;
    }
    free(events);
    return most;
}
