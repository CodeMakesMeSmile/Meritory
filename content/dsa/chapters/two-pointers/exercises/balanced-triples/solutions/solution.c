#include <stdlib.h>
#include <string.h>

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

int** balancedTriples(int* amounts, int amountsSize, int* returnSize, int** returnColumnSizes) {
    int* sorted = malloc(sizeof(int) * (amountsSize > 0 ? amountsSize : 1));
    memcpy(sorted, amounts, sizeof(int) * amountsSize);
    qsort(sorted, amountsSize, sizeof(int), compareInts);
    // The number of sets isn't known ahead, so the list doubles when full
    int capacity = 16;
    int** found = malloc(sizeof(int*) * capacity);
    *returnSize = 0;
    for (int i = 0; i < amountsSize - 2; i++) {
        // A repeated first amount would find the same sets again
        if (i > 0 && sorted[i] == sorted[i - 1]) continue;
        int left = i + 1;
        int right = amountsSize - 1;
        while (left < right) {
            int sum = sorted[i] + sorted[left] + sorted[right];
            if (sum < 0) {
                left++;
            } else if (sum > 0) {
                right--;
            } else {
                if (*returnSize == capacity) {
                    capacity *= 2;
                    found = realloc(found, sizeof(int*) * capacity);
                }
                int* set = malloc(sizeof(int) * 3);
                set[0] = sorted[i];
                set[1] = sorted[left];
                set[2] = sorted[right];
                found[(*returnSize)++] = set;
                left++;
                right--;
                while (left < right && sorted[left] == sorted[left - 1]) left++;
            }
        }
    }
    *returnColumnSizes = malloc(sizeof(int) * (*returnSize > 0 ? *returnSize : 1));
    for (int s = 0; s < *returnSize; s++) (*returnColumnSizes)[s] = 3;
    free(sorted);
    return found;
}
