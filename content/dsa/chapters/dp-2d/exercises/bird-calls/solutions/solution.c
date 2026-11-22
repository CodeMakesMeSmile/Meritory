#include <stdlib.h>
#include <string.h>

#define MOD 1000000007LL

int songCount(char* calls, char* song) {
    int m = (int)strlen(song);
    // ways[j] counts the ways to spell the first j notes of song from the calls so far
    long long* ways = calloc(m + 1, sizeof(long long));
    ways[0] = 1;
    for (int i = 0; calls[i]; i++) {
        // Going down keeps ways[j - 1] from before this call, so each call is used once
        for (int j = m; j >= 1; j--) {
            if (song[j - 1] == calls[i]) ways[j] = (ways[j] + ways[j - 1]) % MOD;
        }
    }
    int answer = (int)ways[m];
    free(ways);
    return answer;
}
