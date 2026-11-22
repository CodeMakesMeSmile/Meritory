#include <stdlib.h>

int fewestRides(int n, int** routes, int routesSize, int* routesColSize, int start, int goal) {
    // The adjacency list as one array: island i's neighbours run from first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    for (int i = 0; i < routesSize; i++) {
        first[routes[i][0] + 1]++;
        first[routes[i][1] + 1]++;
    }
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    int* neighbours = malloc(sizeof(int) * (routesSize > 0 ? 2 * routesSize : 1));
    for (int i = 0; i < routesSize; i++) {
        int a = routes[i][0];
        int b = routes[i][1];
        neighbours[fill[a]++] = b;
        neighbours[fill[b]++] = a;
    }
    // rides[i] stays -1 until island i is first reached, which is by the fewest rides
    int* rides = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) rides[i] = -1;
    rides[start] = 0;
    // Each island joins the queue at most once, so n slots are enough
    int* queue = malloc(sizeof(int) * n);
    int head = 0;
    int tail = 0;
    queue[tail++] = start;
    int answer = -1;
    while (head < tail) {
        int at = queue[head++];
        if (at == goal) {
            answer = rides[at];
            break;
        }
        for (int j = first[at]; j < first[at + 1]; j++) {
            int next = neighbours[j];
            // Marking an island as it joins the queue keeps it from joining twice
            if (rides[next] == -1) {
                rides[next] = rides[at] + 1;
                queue[tail++] = next;
            }
        }
    }
    free(first);
    free(fill);
    free(neighbours);
    free(rides);
    free(queue);
    return answer;
}
