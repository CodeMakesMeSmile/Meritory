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

int peakLoad(int** appliances, int appliancesSize, int* appliancesColSize) {
    Event* events = malloc(sizeof(Event) * (appliancesSize > 0 ? 2 * appliancesSize : 1));
    for (int i = 0; i < appliancesSize; i++) {
        int* appliance = appliances[i];
        // Drawing through minute off is the same as stopping as minute off + 1 starts
        events[2 * i] = (Event){appliance[0], appliance[2]};
        events[2 * i + 1] = (Event){appliance[1] + 1, -appliance[2]};
    }
    // At the same minute, switching off comes first
    qsort(events, 2 * appliancesSize, sizeof(Event), compareEvents);
    int load = 0;
    int peak = 0;
    for (int i = 0; i < 2 * appliancesSize; i++) {
        load += events[i].change;
        if (load > peak) peak = load;
    }
    free(events);
    return peak;
}
