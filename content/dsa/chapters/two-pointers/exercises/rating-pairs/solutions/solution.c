#include <stdlib.h>
#include <string.h>

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

int** ratingPairs(int* ratings, int ratingsSize, int target, int* returnSize, int** returnColumnSizes) {
    int* sorted = malloc(sizeof(int) * (ratingsSize > 0 ? ratingsSize : 1));
    memcpy(sorted, ratings, sizeof(int) * ratingsSize);
    qsort(sorted, ratingsSize, sizeof(int), compareInts);
    // Each pair uses two players, so there are at most n / 2 pairs
    int most = ratingsSize / 2 > 0 ? ratingsSize / 2 : 1;
    int** pairs = malloc(sizeof(int*) * most);
    *returnColumnSizes = malloc(sizeof(int) * most);
    *returnSize = 0;
    int left = 0;
    int right = ratingsSize - 1;
    while (left < right) {
        int sum = sorted[left] + sorted[right];
        if (sum < target) {
            left++;
        } else if (sum > target) {
            right--;
        } else {
            int* pair = malloc(sizeof(int) * 2);
            pair[0] = sorted[left];
            pair[1] = sorted[right];
            pairs[*returnSize] = pair;
            (*returnColumnSizes)[(*returnSize)++] = 2;
            left++;
            right--;
            // Copies of the rating just used would make the same pair again
            while (left < right && sorted[left] == sorted[left - 1]) left++;
        }
    }
    free(sorted);
    return pairs;
}
