#include <stdlib.h>

int* priceSpans(int* prices, int pricesSize, int* returnSize) {
    int* spans = malloc(sizeof(int) * (pricesSize > 0 ? pricesSize : 1));
    // Earlier days that could still end a span, with prices falling from bottom to top
    int* higher = malloc(sizeof(int) * (pricesSize > 0 ? pricesSize : 1));
    int top = 0;
    for (int day = 0; day < pricesSize; day++) {
        while (top > 0 && prices[higher[top - 1]] <= prices[day]) top--;
        // The day left on top is the last one with a higher price
        int stop = top > 0 ? higher[top - 1] : -1;
        spans[day] = day - stop;
        higher[top++] = day;
    }
    free(higher);
    *returnSize = pricesSize;
    return spans;
}
