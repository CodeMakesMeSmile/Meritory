#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>

bool hasEndlessBonus(int n, int** doors, int doorsSize, int* doorsColSize, int start) {
    // coins[room] is the least the player has paid to reach that room so far
    int* coins = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) coins[i] = INT_MAX;
    coins[start] = 0;
    // n - 1 rounds settle every cheapest path, unless a loop keeps paying
    bool changed = true;
    for (int round = 1; round < n && changed; round++) {
        changed = false;
        for (int i = 0; i < doorsSize; i++) {
            int from = doors[i][0];
            int to = doors[i][1];
            // A room the player can't reach yet can't make anything cheaper, and INT_MAX plus a toll would overflow
            if (coins[from] != INT_MAX && coins[from] + doors[i][2] < coins[to]) {
                coins[to] = coins[from] + doors[i][2];
                changed = true;
            }
        }
    }
    // One more round: a room that still gets cheaper is fed by a paying loop
    bool paying = false;
    for (int i = 0; i < doorsSize && !paying; i++) {
        int from = doors[i][0];
        if (coins[from] != INT_MAX && coins[from] + doors[i][2] < coins[doors[i][1]]) paying = true;
    }
    free(coins);
    return paying;
}
