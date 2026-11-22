#include <stdlib.h>

static int firstAtLeast(int* days, int daysSize, int target) {
    int lo = 0;
    int hi = daysSize;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (days[mid] >= target) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

int* bookingRange(int* days, int daysSize, int day, int* returnSize) {
    int* range = malloc(sizeof(int) * 2);
    *returnSize = 2;
    int start = firstAtLeast(days, daysSize, day);
    if (start == daysSize || days[start] != day) {
        range[0] = -1;
        range[1] = -1;
        return range;
    }
    // The first booking on a later day sits just past the last booking on this one
    int end = firstAtLeast(days, daysSize, day + 1);
    range[0] = start;
    range[1] = end - 1;
    return range;
}
