#include <limits.h>
#include <stdlib.h>

int cheapestRoute(int n, int** routes, int routesSize, int* routesColSize, int source, int target, int maxStops) {
    int* price = malloc(sizeof(int) * n);
    int* next = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) price[i] = INT_MAX;
    price[source] = 0;
    // maxStops stops means maxStops + 1 routes, and each round adds one more route
    for (int round = 0; round <= maxStops; round++) {
        // Read last round's prices and write to a copy, so one round can't chain two routes
        for (int i = 0; i < n; i++) next[i] = price[i];
        for (int i = 0; i < routesSize; i++) {
            int from = routes[i][0];
            int to = routes[i][1];
            // Checking first keeps INT_MAX + cost from overflowing
            if (price[from] != INT_MAX && price[from] + routes[i][2] < next[to]) {
                next[to] = price[from] + routes[i][2];
            }
        }
        int* held = price;
        price = next;
        next = held;
    }
    int answer = price[target] == INT_MAX ? -1 : price[target];
    free(price);
    free(next);
    return answer;
}
