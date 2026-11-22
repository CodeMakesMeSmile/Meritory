#include <stdlib.h>

#define MOD 1000000007LL

int changeWays(int* coins, int coinsSize, int amount) {
    // ways[a] counts the sets that make a from the coins handled so far
    long long* ways = calloc(amount + 1, sizeof(long long));
    ways[0] = 1;
    // Coins in the outer loop build each set in one order, so it's counted once
    for (int k = 0; k < coinsSize; k++) {
        for (int a = coins[k]; a <= amount; a++) {
            ways[a] = (ways[a] + ways[a - coins[k]]) % MOD;
        }
    }
    int answer = (int)ways[amount];
    free(ways);
    return answer;
}
