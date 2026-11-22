#include <stdlib.h>

int* lowestFromHere(int* prices, int pricesSize, int* returnSize) {
    int* days = malloc(sizeof(int) * (pricesSize > 0 ? pricesSize : 1));
    int count = 0;
    // Walk from the end, keeping the lowest price seen after each day
    for (int i = pricesSize - 1; i >= 0; i--) {
        if (count == 0 || prices[i] < prices[days[count - 1]]) {
            days[count++] = i;
        }
    }
    // The days were found last to first, so reverse them in place
    for (int lo = 0, hi = count - 1; lo < hi; lo++, hi--) {
        int swap = days[lo];
        days[lo] = days[hi];
        days[hi] = swap;
    }
    *returnSize = count;
    return days;
}
