#include <stdlib.h>

#define MOD 1000000007LL

int orchardPaths(int** orchard, int orchardSize, int* orchardColSize) {
    int cols = orchardColSize[0];
    // Before a row is handled, row[c] holds the paths into the plot above
    long long* row = calloc(cols, sizeof(long long));
    // One path comes into the gate, as if from above
    row[0] = 1;
    for (int r = 0; r < orchardSize; r++) {
        for (int c = 0; c < cols; c++) {
            if (orchard[r][c] == 1) {
                row[c] = 0;
            } else if (c > 0) {
                // Paths from above are already in row[c], so add the paths from the left
                row[c] = (row[c] + row[c - 1]) % MOD;
            }
        }
    }
    int answer = (int)row[cols - 1];
    free(row);
    return answer;
}
