#include <stdlib.h>

int* fillTheBreak(int* lengths, int lengthsSize, int target, int* returnSize) {
    int* pair = malloc(sizeof(int) * 2);
    *returnSize = 0;
    int left = 0;
    int right = lengthsSize - 1;
    while (left < right) {
        int sum = lengths[left] + lengths[right];
        if (sum == target) {
            pair[0] = left;
            pair[1] = right;
            *returnSize = 2;
            break;
        }
        // A short total means no partner still in play is long enough for the left song
        if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return pair;
}
