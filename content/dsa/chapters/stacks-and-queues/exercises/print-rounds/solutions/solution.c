#include <stdlib.h>

int* finishOrder(int* pages, int pagesSize, int k, int* returnSize) {
    int slots = pagesSize > 0 ? pagesSize : 1;
    int* left = malloc(sizeof(int) * slots);
    // The line never holds more than n jobs, so it wraps around n slots
    int* queue = malloc(sizeof(int) * slots);
    int* finished = malloc(sizeof(int) * slots);
    for (int job = 0; job < pagesSize; job++) {
        left[job] = pages[job];
        queue[job] = job;
    }
    int head = 0;
    int waiting = pagesSize;
    int done = 0;
    while (waiting > 0) {
        int job = queue[head];
        head = (head + 1) % slots;
        waiting--;
        left[job] -= k;
        if (left[job] > 0) {
            queue[(head + waiting) % slots] = job;
            waiting++;
        } else {
            finished[done++] = job;
        }
    }
    free(left);
    free(queue);
    *returnSize = done;
    return finished;
}
