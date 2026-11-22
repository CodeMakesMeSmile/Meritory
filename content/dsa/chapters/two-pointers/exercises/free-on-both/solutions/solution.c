#include <stdlib.h>

int* freeOnBoth(int* first, int firstSize, int* second, int secondSize, int* returnSize) {
    int most = firstSize < secondSize ? firstSize : secondSize;
    int* shared = malloc(sizeof(int) * (most > 0 ? most : 1));
    int count = 0;
    int i = 0;
    int j = 0;
    while (i < firstSize && j < secondSize) {
        if (first[i] < second[j]) {
            i++;
        } else if (first[i] > second[j]) {
            j++;
        } else {
            // Repeats sit side by side, so only add a day the answer doesn't end with
            if (count == 0 || shared[count - 1] != first[i]) {
                shared[count++] = first[i];
            }
            i++;
            j++;
        }
    }
    *returnSize = count;
    return shared;
}
