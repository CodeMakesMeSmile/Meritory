#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

// True when text[from] to text[to - 1] is one of the words
static bool isWord(const char* text, int from, int to, char** words, int wordsSize) {
    int length = to - from;
    for (int k = 0; k < wordsSize; k++) {
        if ((int)strlen(words[k]) == length && strncmp(text + from, words[k], length) == 0) return true;
    }
    return false;
}

bool canSplit(char* text, char** words, int wordsSize) {
    int n = (int)strlen(text);
    int longest = 0;
    for (int k = 0; k < wordsSize; k++) {
        int length = (int)strlen(words[k]);
        if (length > longest) longest = length;
    }
    // ok[i] says whether the first i letters split into words
    bool* ok = calloc(n + 1, sizeof(bool));
    ok[0] = true;
    for (int i = 1; i <= n; i++) {
        // The last word starts at j, and no word is longer than the longest
        int start = i - longest > 0 ? i - longest : 0;
        for (int j = start; j < i && !ok[i]; j++) {
            ok[i] = ok[j] && isWord(text, j, i, words, wordsSize);
        }
    }
    bool answer = ok[n];
    free(ok);
    return answer;
}
