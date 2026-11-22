#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>

int fewestAgainst(int n, int** streets, int streetsSize, int* streetsColSize, int start, int goal) {
    // Each street is listed under both ends: riding the right way costs 0, and walking the wrong way costs 1
    int ends = 2 * streetsSize;
    // The adjacency list as one array: junction i's streets run from first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    for (int i = 0; i < streetsSize; i++) {
        first[streets[i][0] + 1]++;
        first[streets[i][1] + 1]++;
    }
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    int* to = malloc(sizeof(int) * (ends > 0 ? ends : 1));
    int* cost = malloc(sizeof(int) * (ends > 0 ? ends : 1));
    for (int i = 0; i < streetsSize; i++) {
        int a = streets[i][0];
        int b = streets[i][1];
        to[fill[a]] = b;
        cost[fill[a]++] = 0;
        to[fill[b]] = a;
        cost[fill[b]++] = 1;
    }
    int* walked = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) walked[i] = INT_MAX;
    bool* done = calloc(n, sizeof(bool));
    walked[start] = 0;
    // A deque as a ring buffer: each junction relaxes its street ends once, so this many slots never fill
    int size = ends + 1;
    int* deque = malloc(sizeof(int) * size);
    int head = 0;
    int count = 1;
    deque[0] = start;
    while (count > 0) {
        int at = deque[head];
        head = (head + 1) % size;
        count--;
        // A junction can be added more than once, and only its first time out counts
        if (done[at]) continue;
        done[at] = true;
        for (int j = first[at]; j < first[at + 1]; j++) {
            int next = to[j];
            if (walked[at] + cost[j] < walked[next]) {
                walked[next] = walked[at] + cost[j];
                if (cost[j] == 0) {
                    // Riding costs nothing more, so it goes to the front
                    head = (head - 1 + size) % size;
                    deque[head] = next;
                } else {
                    // Walking costs one more, so it waits at the back
                    deque[(head + count) % size] = next;
                }
                count++;
            }
        }
    }
    int answer = walked[goal] == INT_MAX ? -1 : walked[goal];
    free(first);
    free(fill);
    free(to);
    free(cost);
    free(walked);
    free(done);
    free(deque);
    return answer;
}
