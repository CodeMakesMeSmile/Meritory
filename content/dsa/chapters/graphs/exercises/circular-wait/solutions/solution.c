#include <stdbool.h>
#include <stdlib.h>

bool hasCircularWait(int n, int** waits, int waitsSize, int* waitsColSize) {
    // A wait {a, b} means b must finish first, so b unlocks a
    // The adjacency list as one array: step i unlocks everything from first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    int* waiting = calloc(n, sizeof(int));
    for (int i = 0; i < waitsSize; i++) {
        first[waits[i][1] + 1]++;
        waiting[waits[i][0]]++;
    }
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    int* unlocks = malloc(sizeof(int) * (waitsSize > 0 ? waitsSize : 1));
    for (int i = 0; i < waitsSize; i++) unlocks[fill[waits[i][1]]++] = waits[i][0];
    // Each step becomes ready at most once, so n slots are enough
    int* ready = malloc(sizeof(int) * n);
    int tail = 0;
    for (int step = 0; step < n; step++) if (waiting[step] == 0) ready[tail++] = step;
    // Kahn's algorithm: finish a ready step, then free whatever was only waiting on it
    for (int head = 0; head < tail; head++) {
        int step = ready[head];
        for (int j = first[step]; j < first[step + 1]; j++) {
            int next = unlocks[j];
            waiting[next]--;
            if (waiting[next] == 0) ready[tail++] = next;
        }
    }
    free(first);
    free(waiting);
    free(fill);
    free(unlocks);
    free(ready);
    // A step in a circle, or behind one, never becomes ready
    return tail < n;
}
