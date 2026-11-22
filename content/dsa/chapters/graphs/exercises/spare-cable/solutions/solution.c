#include <stdlib.h>

static int find(int* parent, int building) {
    int root = building;
    while (parent[root] != root) root = parent[root];
    // Path compression: point every building on the way straight at the root
    int at = building;
    while (parent[at] != root) {
        int next = parent[at];
        parent[at] = root;
        at = next;
    }
    return root;
}

int* spareCable(int n, int** cables, int cablesSize, int* cablesColSize, int* returnSize) {
    // Each building points to its parent, and a group's root points to itself
    int* parent = malloc(sizeof(int) * n);
    // A root's rank is an upper bound on its tree's height
    int* rank = calloc(n, sizeof(int));
    for (int i = 0; i < n; i++) parent[i] = i;
    int* answer = malloc(sizeof(int) * 2);
    *returnSize = 0;
    for (int i = 0; i < cablesSize; i++) {
        int a = cables[i][0];
        int b = cables[i][1];
        int rootA = find(parent, a);
        int rootB = find(parent, b);
        // Already in the same group, so this cable only closes a loop
        if (rootA == rootB) {
            answer[0] = a;
            answer[1] = b;
            *returnSize = 2;
            break;
        }
        // Union by rank: hang the shorter tree under the taller one
        if (rank[rootA] < rank[rootB]) {
            parent[rootA] = rootB;
        } else if (rank[rootA] > rank[rootB]) {
            parent[rootB] = rootA;
        } else {
            parent[rootB] = rootA;
            rank[rootA]++;
        }
    }
    free(parent);
    free(rank);
    return answer;
}
