#include <stdlib.h>

int sharedLandmarks(int* first, int firstSize, int* second, int secondSize) {
    int n = firstSize;
    int m = secondSize;
    int width = m + 1;
    // shared[i * width + j] is the answer for the first i landmarks of first and the first j of second
    int* shared = calloc((n + 1) * width, sizeof(int));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (first[i - 1] == second[j - 1]) {
                // The two last landmarks match, so they end the list together
                shared[i * width + j] = shared[(i - 1) * width + j - 1] + 1;
            } else {
                // One of the two last landmarks isn't used, so drop one or the other
                int up = shared[(i - 1) * width + j];
                int left = shared[i * width + j - 1];
                shared[i * width + j] = up > left ? up : left;
            }
        }
    }
    int answer = shared[n * width + m];
    free(shared);
    return answer;
}
