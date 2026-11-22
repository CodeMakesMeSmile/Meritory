#include <stdlib.h>

typedef struct {
    int a;
    int b;
    int cost;
} Pipe;

static int compareCost(const void* x, const void* y) {
    int left = ((const Pipe*)x)->cost;
    int right = ((const Pipe*)y)->cost;
    return (left > right) - (left < right);
}

static int find(int* parent, int greenhouse) {
    int root = greenhouse;
    while (parent[root] != root) root = parent[root];
    // Path compression: point every greenhouse on the way straight at the root
    int at = greenhouse;
    while (parent[at] != root) {
        int next = parent[at];
        parent[at] = root;
        at = next;
    }
    return root;
}

int leastPipe(int n, int** pipes, int pipesSize, int* pipesColSize) {
    // Cheapest pipes first, in a copy so the caller's list stays as it was
    Pipe* sorted = malloc(sizeof(Pipe) * (pipesSize > 0 ? pipesSize : 1));
    for (int i = 0; i < pipesSize; i++) sorted[i] = (Pipe){pipes[i][0], pipes[i][1], pipes[i][2]};
    qsort(sorted, pipesSize, sizeof(Pipe), compareCost);
    // Each greenhouse points to its parent, and a group's root points to itself
    int* parent = malloc(sizeof(int) * n);
    // A root's rank is an upper bound on its tree's height
    int* rank = calloc(n, sizeof(int));
    for (int i = 0; i < n; i++) parent[i] = i;
    int total = 0;
    int laid = 0;
    // A tree over n greenhouses needs exactly n - 1 pipes
    for (int i = 0; i < pipesSize && laid < n - 1; i++) {
        int rootA = find(parent, sorted[i].a);
        int rootB = find(parent, sorted[i].b);
        // Already joined, so this pipe would only close a loop
        if (rootA == rootB) continue;
        // Union by rank: hang the shorter tree under the taller one
        if (rank[rootA] < rank[rootB]) {
            parent[rootA] = rootB;
        } else if (rank[rootA] > rank[rootB]) {
            parent[rootB] = rootA;
        } else {
            parent[rootB] = rootA;
            rank[rootA]++;
        }
        total += sorted[i].cost;
        laid++;
    }
    free(sorted);
    free(parent);
    free(rank);
    // Running out of pipes before n - 1 means some greenhouse can't be reached
    return laid == n - 1 ? total : -1;
}
