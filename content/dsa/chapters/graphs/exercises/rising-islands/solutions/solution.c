#include <stdbool.h>
#include <stdlib.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

static int find(int* parent, int cell) {
    int root = cell;
    while (parent[root] != root) root = parent[root];
    // Path compression: point every cell on the way straight at the root
    int at = cell;
    while (parent[at] != root) {
        int next = parent[at];
        parent[at] = root;
        at = next;
    }
    return root;
}

// Joins two groups, and says whether they were apart before
static bool unite(int* parent, int* rank, int a, int b) {
    int rootA = find(parent, a);
    int rootB = find(parent, b);
    if (rootA == rootB) return false;
    // Union by rank: hang the shorter tree under the taller one
    if (rank[rootA] < rank[rootB]) {
        parent[rootA] = rootB;
    } else if (rank[rootA] > rank[rootB]) {
        parent[rootB] = rootA;
    } else {
        parent[rootB] = rootA;
        rank[rootA]++;
    }
    return true;
}

int* islandsAfterEach(int rows, int cols, int** raised, int raisedSize, int* raisedColSize, int* returnSize) {
    // Cell (r, c) is number r * cols + c, and a parent of -1 means it's still sea
    int* parent = malloc(sizeof(int) * rows * cols);
    for (int i = 0; i < rows * cols; i++) parent[i] = -1;
    // A root's rank is an upper bound on its tree's height
    int* rank = calloc(rows * cols, sizeof(int));
    int* counts = malloc(sizeof(int) * (raisedSize > 0 ? raisedSize : 1));
    int islands = 0;
    for (int i = 0; i < raisedSize; i++) {
        int r = raised[i][0];
        int c = raised[i][1];
        int cell = r * cols + c;
        // Land that rises again changes nothing
        if (parent[cell] == -1) {
            parent[cell] = cell;
            islands++;
            // Each join with a neighbouring island merges two into one
            for (int s = 0; s < 4; s++) {
                int nr = r + STEPS[s][0];
                int nc = c + STEPS[s][1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                int next = nr * cols + nc;
                if (parent[next] != -1 && unite(parent, rank, cell, next)) islands--;
            }
        }
        counts[i] = islands;
    }
    *returnSize = raisedSize;
    free(parent);
    free(rank);
    return counts;
}
