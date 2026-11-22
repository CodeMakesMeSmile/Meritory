#include <stdlib.h>

int earliestFinish(int* hours, int hoursSize, int** needs, int needsSize, int* needsColSize) {
    int n = hoursSize;
    // The adjacency list as one array: task i unlocks everything from first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    int* waiting = calloc(n, sizeof(int));
    for (int i = 0; i < needsSize; i++) {
        first[needs[i][0] + 1]++;
        waiting[needs[i][1]]++;
    }
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    int* unlocks = malloc(sizeof(int) * (needsSize > 0 ? needsSize : 1));
    for (int i = 0; i < needsSize; i++) unlocks[fill[needs[i][0]]++] = needs[i][1];
    // begin[i] is the latest finish of everything task i waits on so far
    int* begin = calloc(n, sizeof(int));
    // Kahn's algorithm: a task joins the order once everything it waits on is in it
    int* order = malloc(sizeof(int) * n);
    int tail = 0;
    for (int task = 0; task < n; task++) {
        if (waiting[task] == 0) order[tail++] = task;
    }
    int last = 0;
    for (int head = 0; head < tail; head++) {
        int task = order[head];
        // Everything this task waits on came earlier in the order, so its start is final
        int finish = begin[task] + hours[task];
        if (finish > last) last = finish;
        for (int j = first[task]; j < first[task + 1]; j++) {
            int next = unlocks[j];
            if (finish > begin[next]) begin[next] = finish;
            if (--waiting[next] == 0) order[tail++] = next;
        }
    }
    free(first);
    free(waiting);
    free(fill);
    free(unlocks);
    free(begin);
    free(order);
    return last;
}
