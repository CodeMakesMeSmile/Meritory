#include <stdlib.h>
#include <string.h>

int fewestDeletions(char* first, char* second) {
    int n = (int)strlen(first);
    int m = (int)strlen(second);
    // kept[j] is the longest common subsequence of the first i letters of first and the first j of second
    int* kept = calloc(m + 1, sizeof(int));
    for (int i = 1; i <= n; i++) {
        // The entry up and to the left, saved before the update overwrites it
        int diagonal = 0;
        for (int j = 1; j <= m; j++) {
            int above = kept[j];
            if (first[i - 1] == second[j - 1]) {
                kept[j] = diagonal + 1;
            } else {
                kept[j] = above > kept[j - 1] ? above : kept[j - 1];
            }
            diagonal = above;
        }
    }
    // Every letter outside the longest shared part has to go
    int answer = n + m - 2 * kept[m];
    free(kept);
    return answer;
}
