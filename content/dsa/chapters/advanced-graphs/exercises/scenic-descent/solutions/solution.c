#include <stdlib.h>

int mostScenic(int n, int** runs, int runsSize, int* runsColSize, int start, int goal) {
    // The adjacency list as one array: hut i's runs go from first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    int* waiting = calloc(n, sizeof(int));
    for (int i = 0; i < runsSize; i++) {
        first[runs[i][0] + 1]++;
        waiting[runs[i][1]]++;
    }
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    int* to = malloc(sizeof(int) * (runsSize > 0 ? runsSize : 1));
    int* views = malloc(sizeof(int) * (runsSize > 0 ? runsSize : 1));
    for (int i = 0; i < runsSize; i++) {
        int slot = fill[runs[i][0]]++;
        to[slot] = runs[i][1];
        views[slot] = runs[i][2];
    }
    // best[hut] is the most views on any way down from start so far, and -1 means not reached
    int* best = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) best[i] = -1;
    best[start] = 0;
    // Kahn's algorithm gives an order where every run points later in the order
    int* order = malloc(sizeof(int) * n);
    int tail = 0;
    for (int hut = 0; hut < n; hut++) {
        if (waiting[hut] == 0) order[tail++] = hut;
    }
    for (int head = 0; head < tail; head++) {
        int hut = order[head];
        // Every run into this hut came from earlier in the order, so its best is final
        for (int j = first[hut]; j < first[hut + 1]; j++) {
            int next = to[j];
            // Only huts reached from the start can pass on a score
            if (best[hut] != -1 && best[hut] + views[j] > best[next]) best[next] = best[hut] + views[j];
            if (--waiting[next] == 0) order[tail++] = next;
        }
    }
    int answer = best[goal];
    free(first);
    free(waiting);
    free(fill);
    free(to);
    free(views);
    free(best);
    free(order);
    return answer;
}
