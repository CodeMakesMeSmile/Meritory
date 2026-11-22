#include <stdbool.h>
#include <stdlib.h>

bool canSplitEvenly(int* parcels, int parcelsSize) {
    int total = 0;
    for (int i = 0; i < parcelsSize; i++) total += parcels[i];
    // Two equal whole totals can't add up to an odd number
    if (total % 2 == 1) return false;
    int half = total / 2;
    // reachable[w] says whether some of the parcels so far weigh exactly w
    bool* reachable = calloc(half + 1, sizeof(bool));
    reachable[0] = true;
    for (int i = 0; i < parcelsSize; i++) {
        // Going down keeps reachable[w - weight] from before this parcel, so it's used once
        for (int w = half; w >= parcels[i]; w--) {
            if (reachable[w - parcels[i]]) reachable[w] = true;
        }
    }
    bool answer = reachable[half];
    free(reachable);
    return answer;
}
