#include <stdlib.h>

static int compareStarts(const void* a, const void* b) {
    int x = (*(int* const*)a)[0];
    int y = (*(int* const*)b)[0];
    return (x > y) - (x < y);
}

int** mergeBookings(int** bookings, int bookingsSize, int* bookingsColSize, int* returnSize, int** returnColumnSizes) {
    int room = bookingsSize > 0 ? bookingsSize : 1;
    // Sort pointers to the bookings, so the input is left as it was
    int** byStart = malloc(sizeof(int*) * room);
    for (int i = 0; i < bookingsSize; i++) byStart[i] = bookings[i];
    qsort(byStart, bookingsSize, sizeof(int*), compareStarts);
    int** merged = malloc(sizeof(int*) * room);
    *returnColumnSizes = malloc(sizeof(int) * room);
    int count = 0;
    for (int i = 0; i < bookingsSize; i++) {
        int start = byStart[i][0];
        int end = byStart[i][1];
        // A booking that overlaps or touches the stretch so far joins it
        if (count > 0 && start <= merged[count - 1][1]) {
            if (end > merged[count - 1][1]) merged[count - 1][1] = end;
        } else {
            merged[count] = malloc(sizeof(int) * 2);
            merged[count][0] = start;
            merged[count][1] = end;
            (*returnColumnSizes)[count] = 2;
            count++;
        }
    }
    free(byStart);
    *returnSize = count;
    return merged;
}
