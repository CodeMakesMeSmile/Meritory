#include <stdlib.h>
#include <string.h>

static int smallest(int a, int b, int c) {
    int low = a < b ? a : b;
    return low < c ? low : c;
}

int fewestEdits(char* typed, char* word) {
    int n = (int)strlen(typed);
    int m = (int)strlen(word);
    int width = m + 1;
    // edits[i * width + j] turns the first i letters of typed into the first j letters of word
    int* edits = malloc(sizeof(int) * (n + 1) * width);
    // From i letters to none is i removals, and from none to j letters is j additions
    for (int i = 0; i <= n; i++) edits[i * width] = i;
    for (int j = 0; j <= m; j++) edits[j] = j;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (typed[i - 1] == word[j - 1]) {
                // The last letters already match, so they cost nothing
                edits[i * width + j] = edits[(i - 1) * width + j - 1];
            } else {
                // Change the last letter, remove it, or add the word's last letter
                edits[i * width + j] = 1 + smallest(edits[(i - 1) * width + j - 1],
                                                    edits[(i - 1) * width + j],
                                                    edits[i * width + j - 1]);
            }
        }
    }
    int answer = edits[n * width + m];
    free(edits);
    return answer;
}
