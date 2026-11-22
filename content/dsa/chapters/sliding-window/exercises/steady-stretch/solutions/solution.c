#include <stdlib.h>

int steadyStretch(int* temperatures, int temperaturesSize, int limit) {
    int room = temperaturesSize > 0 ? temperaturesSize : 1;
    // Positions with readings falling from front to back, so the front is the highest
    int* highs = malloc(sizeof(int) * room);
    // Positions with readings rising from front to back, so the front is the lowest
    int* lows = malloc(sizeof(int) * room);
    int highFront = 0;
    int highBack = 0;
    int lowFront = 0;
    int lowBack = 0;
    int longest = 0;
    int left = 0;
    for (int right = 0; right < temperaturesSize; right++) {
        int reading = temperatures[right];
        while (highBack > highFront && temperatures[highs[highBack - 1]] <= reading) highBack--;
        highs[highBack++] = right;
        while (lowBack > lowFront && temperatures[lows[lowBack - 1]] >= reading) lowBack--;
        lows[lowBack++] = right;
        // Shrink until the highest and lowest readings are close enough
        while (temperatures[highs[highFront]] - temperatures[lows[lowFront]] > limit) {
            left++;
            if (highs[highFront] < left) highFront++;
            if (lows[lowFront] < left) lowFront++;
        }
        if (right - left + 1 > longest) longest = right - left + 1;
    }
    free(highs);
    free(lows);
    return longest;
}
