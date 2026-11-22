#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

#define MOD 1000000007LL

// True when text[from] to text[to - 1] is one of the words
static bool isWord(const char* text, int from, int to, char** words, int wordsSize) {
    int length = to - from;
    for (int k = 0; k < wordsSize; k++) {
        if ((int)strlen(words[k]) == length && strncmp(text + from, words[k], length) == 0) return true;
    }
    return false;
}

int splitCount(char* text, char** words, int wordsSize) {
    int n = (int)strlen(text);
    int longest = 0;
    for (int k = 0; k < wordsSize; k++) {
        int length = (int)strlen(words[k]);
        if (length > longest) longest = length;
    }
    // ways[i] counts the ways to split the first i letters into words
    long long* ways = calloc(n + 1, sizeof(long long));
    ways[0] = 1;
    for (int i = 1; i <= n; i++) {
        // Every word that ends here adds the ways to split what comes before it
        int start = i - longest > 0 ? i - longest : 0;
        for (int j = start; j < i; j++) {
            if (ways[j] > 0 && isWord(text, j, i, words, wordsSize)) {
                ways[i] = (ways[i] + ways[j]) % MOD;
            }
        }
    }
    int answer = (int)ways[n];
    free(ways);
    return answer;
}
