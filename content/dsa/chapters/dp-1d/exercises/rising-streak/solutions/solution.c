#include <stdlib.h>

int longestRise(int* heights, int heightsSize) {
    // tails[k] is the lowest height that can end a rise of k + 1 points
    int* tails = malloc(sizeof(int) * heightsSize);
    int size = 0;
    for (int i = 0; i < heightsSize; i++) {
        // Find the first tail that's at least this height
        int lo = 0;
        int hi = size;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (tails[mid] >= heights[i]) hi = mid;
            else lo = mid + 1;
        }
        // Extend the longest rise, or give a rise of length lo + 1 a lower end
        tails[lo] = heights[i];
        if (lo == size) size++;
    }
    free(tails);
    return size;
}
