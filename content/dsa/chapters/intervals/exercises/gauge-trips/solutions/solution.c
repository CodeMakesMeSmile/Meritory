#include <stdlib.h>

static int compareEnds(const void* a, const void* b) {
    int x = (*(int* const*)a)[1];
    int y = (*(int* const*)b)[1];
    return (x > y) - (x < y);
}

int fewestTrips(int** windows, int windowsSize, int* windowsColSize) {
    // Sort pointers to the windows, so the input is left as it was
    int** byClose = malloc(sizeof(int*) * (windowsSize > 0 ? windowsSize : 1));
    for (int i = 0; i < windowsSize; i++) byClose[i] = windows[i];
    qsort(byClose, windowsSize, sizeof(int*), compareEnds);
    int trips = 0;
    // The minute of the last trip, before any window opens
    int lastTrip = -1;
    for (int i = 0; i < windowsSize; i++) {
        // This window opened after the last trip, so that trip missed it
        if (byClose[i][0] > lastTrip) {
            trips++;
            // As late as this window allows, which reads every window open by then
            lastTrip = byClose[i][1];
        }
    }
    free(byClose);
    return trips;
}
