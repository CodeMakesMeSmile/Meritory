#include <stdbool.h>
#include <stdlib.h>

bool twoTeams(int n, int** rivals, int rivalsSize, int* rivalsColSize) {
    // The adjacency list as one array: player i's rivals run from start[i] to start[i + 1]
    int* start = calloc(n + 1, sizeof(int));
    for (int i = 0; i < rivalsSize; i++) {
        start[rivals[i][0] + 1]++;
        start[rivals[i][1] + 1]++;
    }
    for (int i = 0; i < n; i++) start[i + 1] += start[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = start[i];
    int* neighbours = malloc(sizeof(int) * (rivalsSize > 0 ? 2 * rivalsSize : 1));
    for (int i = 0; i < rivalsSize; i++) {
        int a = rivals[i][0];
        int b = rivals[i][1];
        neighbours[fill[a]++] = b;
        neighbours[fill[b]++] = a;
    }
    // -1 means no team yet, and otherwise the team is 0 or 1
    int* team = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) team[i] = -1;
    int* stack = malloc(sizeof(int) * n);
    bool possible = true;
    for (int player = 0; player < n && possible; player++) {
        // Every group of rivals needs its own check, so start a walk from each unplaced player
        if (team[player] != -1) continue;
        team[player] = 0;
        int top = 0;
        stack[top++] = player;
        while (top > 0 && possible) {
            int at = stack[--top];
            for (int j = start[at]; j < start[at + 1]; j++) {
                int rival = neighbours[j];
                if (team[rival] == -1) {
                    team[rival] = 1 - team[at];
                    stack[top++] = rival;
                } else if (team[rival] == team[at]) {
                    // Two rivals ended up on the same team, which only a circle of odd length forces
                    possible = false;
                    break;
                }
            }
        }
    }
    free(start);
    free(fill);
    free(neighbours);
    free(team);
    free(stack);
    return possible;
}
