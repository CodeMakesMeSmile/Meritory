#include <stdbool.h>

int firstFailing(bool* builds, int buildsSize) {
    // Every build before lo passed, and every build from hi on failed
    int lo = 0;
    int hi = buildsSize;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (!builds[mid]) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
