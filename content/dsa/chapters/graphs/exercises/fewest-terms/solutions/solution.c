#include <stdlib.h>

int fewestTerms(int n, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize) {
    // The adjacency list as one array: module i unlocks everything from first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    // waiting[m] counts the prerequisites module m hasn't had passed yet
    int* waiting = calloc(n, sizeof(int));
    for (int i = 0; i < prerequisitesSize; i++) {
        first[prerequisites[i][0] + 1]++;
        waiting[prerequisites[i][1]]++;
    }
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    int* unlocks = malloc(sizeof(int) * (prerequisitesSize > 0 ? prerequisitesSize : 1));
    for (int i = 0; i < prerequisitesSize; i++) {
        unlocks[fill[prerequisites[i][0]]++] = prerequisites[i][1];
    }
    // Modules are added in term order, so one array holds every term, one after another
    int* order = malloc(sizeof(int) * n);
    int taken = 0;
    // The first term holds every module with nothing to wait for
    for (int m = 0; m < n; m++) if (waiting[m] == 0) order[taken++] = m;
    int termStart = 0;
    int terms = 0;
    while (termStart < taken) {
        terms++;
        int termEnd = taken;
        for (int t = termStart; t < termEnd; t++) {
            int m = order[t];
            for (int j = first[m]; j < first[m + 1]; j++) {
                int after = unlocks[j];
                waiting[after]--;
                if (waiting[after] == 0) order[taken++] = after;
            }
        }
        termStart = termEnd;
    }
    free(first);
    free(waiting);
    free(fill);
    free(unlocks);
    free(order);
    // Modules in a circle never get down to 0 waiting, so they're never taken
    return taken == n ? terms : -1;
}
