#include <stdlib.h>

#define MOD 1000000007LL

int hopWays(int distance, int* hops, int hopsSize) {
    // ways[d] is the number of jump sequences that land exactly on square d
    long long* ways = calloc(distance + 1, sizeof(long long));
    ways[0] = 1;
    for (int d = 1; d <= distance; d++) {
        for (int k = 0; k < hopsSize; k++) {
            // The last jump could have been any length that fits
            if (hops[k] <= d) ways[d] = (ways[d] + ways[d - hops[k]]) % MOD;
        }
    }
    int answer = (int)ways[distance];
    free(ways);
    return answer;
}
