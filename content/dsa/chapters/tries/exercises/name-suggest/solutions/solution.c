#include <stdlib.h>
#include <string.h>

static int compareNames(const void* a, const void* b) {
    return strcmp(*(char* const*)a, *(char* const*)b);
}

char** suggestNames(char** names, int namesSize, char* prefix, int k, int* returnSize) {
    char** sorted = malloc(sizeof(char*) * (namesSize > 0 ? namesSize : 1));
    memcpy(sorted, names, sizeof(char*) * namesSize);
    qsort(sorted, namesSize, sizeof(char*), compareNames);
    // Binary search for the first name that's at least the prefix
    int low = 0;
    int high = namesSize;
    while (low < high) {
        int middle = low + (high - low) / 2;
        if (strcmp(sorted[middle], prefix) < 0) low = middle + 1;
        else high = middle;
    }
    // Every name that starts with the prefix sits in one run from there
    size_t length = strlen(prefix);
    char** found = malloc(sizeof(char*) * k);
    int count = 0;
    for (int i = low; i < namesSize && count < k; i++) {
        if (strncmp(sorted[i], prefix, length) != 0) break;
        found[count++] = sorted[i];
    }
    free(sorted);
    *returnSize = count;
    return found;
}
