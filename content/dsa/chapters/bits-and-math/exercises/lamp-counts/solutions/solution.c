#include <stdlib.h>

int* lampCounts(int n, int* returnSize) {
    int* counts = malloc(sizeof(int) * (n + 1));
    counts[0] = 0;
    for (int i = 1; i <= n; i++) {
        // i & (i - 1) is i with its lowest 1 cleared, a smaller number already counted
        counts[i] = counts[i & (i - 1)] + 1;
    }
    *returnSize = n + 1;
    return counts;
}
