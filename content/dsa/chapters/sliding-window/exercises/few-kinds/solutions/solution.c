#include <stdlib.h>

#define MAX_KIND 100000

int fewKinds(int* jars, int jarsSize, int k) {
    // Kinds are numbered up to MAX_KIND, so an array of counts is the whole table
    int* counts = calloc(MAX_KIND + 1, sizeof(int));
    int kinds = 0;
    int longest = 0;
    int left = 0;
    for (int right = 0; right < jarsSize; right++) {
        if (counts[jars[right]]++ == 0) kinds++;
        while (kinds > k) {
            if (--counts[jars[left]] == 0) kinds--;
            left++;
        }
        if (right - left + 1 > longest) longest = right - left + 1;
    }
    free(counts);
    return longest;
}
