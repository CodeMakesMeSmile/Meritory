#include <stdlib.h>

int* windowHighs(int* prices, int pricesSize, int k, int* returnSize) {
    // Positions whose prices get smaller from front to back, from head up to tail
    int* deque = malloc(sizeof(int) * pricesSize);
    int head = 0;
    int tail = 0;
    *returnSize = pricesSize - k + 1;
    int* highs = malloc(sizeof(int) * *returnSize);
    for (int right = 0; right < pricesSize; right++) {
        // An older price no higher than this one can never be a high again
        while (tail > head && prices[deque[tail - 1]] <= prices[right]) tail--;
        deque[tail++] = right;
        if (deque[head] <= right - k) head++;
        if (right >= k - 1) highs[right - k + 1] = prices[deque[head]];
    }
    free(deque);
    return highs;
}
