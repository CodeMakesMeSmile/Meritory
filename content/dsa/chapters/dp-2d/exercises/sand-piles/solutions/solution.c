#include <limits.h>
#include <stdlib.h>

long long cheapestJoin(int* piles, int pilesSize) {
    int n = pilesSize;
    // prefix[i] is the weight of the first i piles, so a range's weight is one subtraction
    long long* prefix = calloc(n + 1, sizeof(long long));
    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + piles[i];
    // cost[i * n + j] is the least fuel to join piles i to j into one, and a single pile costs 0
    long long* cost = calloc(n * n, sizeof(long long));
    for (int length = 2; length <= n; length++) {
        for (int i = 0; i + length <= n; i++) {
            int j = i + length - 1;
            // The last join puts piles i to k together with piles k + 1 to j
            long long cheapest = LLONG_MAX;
            for (int k = i; k < j; k++) {
                long long split = cost[i * n + k] + cost[(k + 1) * n + j];
                if (split < cheapest) cheapest = split;
            }
            // Whatever the split, the last join weighs the whole range
            cost[i * n + j] = cheapest + prefix[j + 1] - prefix[i];
        }
    }
    long long answer = cost[n - 1];
    free(prefix);
    free(cost);
    return answer;
}
