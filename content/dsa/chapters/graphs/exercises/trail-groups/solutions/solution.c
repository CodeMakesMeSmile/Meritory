#include <stdbool.h>
#include <stdlib.h>

int trailGroups(int n, int** trails, int trailsSize, int* trailsColSize) {
    // The adjacency list as one array: site i's neighbours run from start[i] to start[i + 1]
    int* start = calloc(n + 1, sizeof(int));
    for (int i = 0; i < trailsSize; i++) {
        start[trails[i][0] + 1]++;
        start[trails[i][1] + 1]++;
    }
    for (int i = 0; i < n; i++) start[i + 1] += start[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = start[i];
    // Each trail goes both ways, so it's listed under both of its campsites
    int* neighbours = malloc(sizeof(int) * (trailsSize > 0 ? 2 * trailsSize : 1));
    for (int i = 0; i < trailsSize; i++) {
        int a = trails[i][0];
        int b = trails[i][1];
        neighbours[fill[a]++] = b;
        neighbours[fill[b]++] = a;
    }
    bool* seen = calloc(n, sizeof(bool));
    // Each site goes on the stack at most once, so n slots are enough
    int* stack = malloc(sizeof(int) * n);
    int groups = 0;
    for (int site = 0; site < n; site++) {
        if (seen[site]) continue;
        // An unseen campsite starts a new group, and the walk marks all of it
        groups++;
        seen[site] = true;
        int top = 0;
        stack[top++] = site;
        while (top > 0) {
            int at = stack[--top];
            for (int j = start[at]; j < start[at + 1]; j++) {
                int next = neighbours[j];
                if (!seen[next]) {
                    seen[next] = true;
                    stack[top++] = next;
                }
            }
        }
    }
    free(start);
    free(fill);
    free(neighbours);
    free(seen);
    free(stack);
    return groups;
}
