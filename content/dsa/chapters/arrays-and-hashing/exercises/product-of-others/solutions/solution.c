#include <stdlib.h>

int* productOfOthers(int* nums, int numsSize, int* returnSize) {
    int* products = malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));
    int left = 1;
    for (int i = 0; i < numsSize; i++) {
        products[i] = left;
        left *= nums[i];
    }
    int right = 1;
    for (int i = numsSize - 1; i >= 0; i--) {
        products[i] *= right;
        right *= nums[i];
    }
    *returnSize = numsSize;
    return products;
}
