#include <stdlib.h>

#define MAX_DISH 100000

int noRepeatDinners(int* dinners, int dinnersSize, int k) {
    // Dishes are numbered up to MAX_DISH, so an array of counts is the whole table
    int* counts = calloc(MAX_DISH + 1, sizeof(int));
    // How many dishes appear more than once in the window
    int repeated = 0;
    int stretches = 0;
    for (int right = 0; right < dinnersSize; right++) {
        if (++counts[dinners[right]] == 2) repeated++;
        if (right >= k && --counts[dinners[right - k]] == 1) repeated--;
        if (right >= k - 1 && repeated == 0) stretches++;
    }
    free(counts);
    return stretches;
}
