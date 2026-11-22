#include <stdlib.h>

int bestTakings(int* weights, int weightsSize, int* takings, int takingsSize, int capacity) {
    // best[w] is the most takings from the crates so far, weighing at most w
    int* best = calloc(capacity + 1, sizeof(int));
    for (int i = 0; i < weightsSize && i < takingsSize; i++) {
        // Going down keeps best[w - weights[i]] from before this crate, so it's packed once
        for (int w = capacity; w >= weights[i]; w--) {
            int packed = best[w - weights[i]] + takings[i];
            if (packed > best[w]) best[w] = packed;
        }
    }
    int answer = best[capacity];
    free(best);
    return answer;
}
