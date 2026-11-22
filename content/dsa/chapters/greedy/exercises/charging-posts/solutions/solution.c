#include <stdbool.h>

bool canReachLast(int* charge, int chargeSize) {
    // The farthest post any post so far can reach
    int farthest = 0;
    for (int i = 0; i < chargeSize; i++) {
        // No earlier post reaches this one, so nothing past it can be reached either
        if (i > farthest) return false;
        if (i + charge[i] > farthest) farthest = i + charge[i];
    }
    return true;
}
