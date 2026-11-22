#include <stdlib.h>

int* nextCheaper(int* prices, int pricesSize, int* returnSize) {
    int* cheaper = malloc(sizeof(int) * (pricesSize > 0 ? pricesSize : 1));
    // Days still waiting for a cheaper price, with prices that never fall from bottom to top
    int* waiting = malloc(sizeof(int) * (pricesSize > 0 ? pricesSize : 1));
    int top = 0;
    for (int day = 0; day < pricesSize; day++) {
        cheaper[day] = -1;
        while (top > 0 && prices[waiting[top - 1]] > prices[day]) {
            cheaper[waiting[--top]] = prices[day];
        }
        waiting[top++] = day;
    }
    free(waiting);
    *returnSize = pricesSize;
    return cheaper;
}
