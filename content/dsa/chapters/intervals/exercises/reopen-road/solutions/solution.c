#include <stdlib.h>

static void add(int** left, int* columns, int* count, int start, int end) {
    left[*count] = malloc(sizeof(int) * 2);
    left[*count][0] = start;
    left[*count][1] = end;
    columns[*count] = 2;
    (*count)++;
}

int** reopenStretch(int** closures, int closuresSize, int* closuresColSize, int* reopened, int reopenedSize, int* returnSize, int** returnColumnSizes) {
    int from = reopened[0];
    int to = reopened[1];
    // One closure can split in two, so there's at most one extra piece
    int** left = malloc(sizeof(int*) * (closuresSize + 1));
    *returnColumnSizes = malloc(sizeof(int) * (closuresSize + 1));
    int count = 0;
    for (int i = 0; i < closuresSize; i++) {
        int start = closures[i][0];
        int end = closures[i][1];
        // Keep whatever sticks out before the reopened stretch, and after it
        if (start < from) add(left, *returnColumnSizes, &count, start, end < from ? end : from);
        if (end > to) add(left, *returnColumnSizes, &count, start > to ? start : to, end);
    }
    *returnSize = count;
    return left;
}
