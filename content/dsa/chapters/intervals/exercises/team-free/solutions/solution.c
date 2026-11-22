#include <stdlib.h>

typedef struct {
    int start;
    int end;
} Busy;

static int compareStarts(const void* a, const void* b) {
    int x = ((const Busy*)a)->start;
    int y = ((const Busy*)b)->start;
    return (x > y) - (x < y);
}

static void add(int** gaps, int* columns, int* count, int start, int end) {
    gaps[*count] = malloc(sizeof(int) * 2);
    gaps[*count][0] = start;
    gaps[*count][1] = end;
    columns[*count] = 2;
    (*count)++;
}

int** teamFree(int** calendars, int calendarsSize, int* calendarsColSize, int dayStart, int dayEnd, int* returnSize, int** returnColumnSizes) {
    // Every busy time from every calendar, as a start and an end
    int total = 0;
    for (int i = 0; i < calendarsSize; i++) total += calendarsColSize[i] / 2;
    Busy* busy = malloc(sizeof(Busy) * (total > 0 ? total : 1));
    int n = 0;
    for (int i = 0; i < calendarsSize; i++) {
        for (int k = 0; k + 1 < calendarsColSize[i]; k += 2) {
            busy[n++] = (Busy){calendars[i][k], calendars[i][k + 1]};
        }
    }
    qsort(busy, n, sizeof(Busy), compareStarts);
    // A gap before each busy time, plus one at the end of the day
    int** gaps = malloc(sizeof(int*) * (n + 1));
    *returnColumnSizes = malloc(sizeof(int) * (n + 1));
    int count = 0;
    // Nobody is busy from here until the next busy time starts
    int freeFrom = dayStart;
    for (int i = 0; i < n; i++) {
        if (busy[i].start > freeFrom) {
            add(gaps, *returnColumnSizes, &count, freeFrom, busy[i].start < dayEnd ? busy[i].start : dayEnd);
        }
        if (busy[i].end > freeFrom) freeFrom = busy[i].end;
        if (freeFrom >= dayEnd) break;
    }
    if (freeFrom < dayEnd) add(gaps, *returnColumnSizes, &count, freeFrom, dayEnd);
    free(busy);
    *returnSize = count;
    return gaps;
}
