#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

bool canMerge(char* first, char* second, char* tape) {
    int n = (int)strlen(first);
    int m = (int)strlen(second);
    if ((int)strlen(tape) != n + m) return false;
    // fits[j] says whether the first i letters of first and the first j of second make the tape's first i + j
    bool* fits = calloc(m + 1, sizeof(bool));
    for (int i = 0; i <= n; i++) {
        for (int j = 0; j <= m; j++) {
            if (i == 0 && j == 0) {
                fits[0] = true;
                continue;
            }
            char letter = tape[i + j - 1];
            // Before this update, fits[j] is still the answer with one less letter of first
            bool fromFirst = i > 0 && fits[j] && first[i - 1] == letter;
            // fits[j - 1] is already this row's, the answer with one less letter of second
            bool fromSecond = j > 0 && fits[j - 1] && second[j - 1] == letter;
            fits[j] = fromFirst || fromSecond;
        }
    }
    bool answer = fits[m];
    free(fits);
    return answer;
}
