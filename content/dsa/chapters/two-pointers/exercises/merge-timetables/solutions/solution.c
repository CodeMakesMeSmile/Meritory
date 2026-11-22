#include <stdlib.h>

int* mergeTimetables(int* first, int firstSize, int* second, int secondSize, int* returnSize) {
    int total = firstSize + secondSize;
    int* merged = malloc(sizeof(int) * (total > 0 ? total : 1));
    int i = 0;
    int j = 0;
    int k = 0;
    while (i < firstSize && j < secondSize) {
        if (first[i] <= second[j]) {
            merged[k++] = first[i++];
        } else {
            merged[k++] = second[j++];
        }
    }
    // One list has run out, so the rest of the other is already in order
    while (i < firstSize) merged[k++] = first[i++];
    while (j < secondSize) merged[k++] = second[j++];
    *returnSize = total;
    return merged;
}
