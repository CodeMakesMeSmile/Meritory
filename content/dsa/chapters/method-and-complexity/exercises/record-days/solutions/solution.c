#include <stdlib.h>

int* recordDays(int* highs, int highsSize, int* returnSize) {
    int* records = malloc(sizeof(int) * (highsSize > 0 ? highsSize : 1));
    int count = 0;
    for (int i = 0; i < highsSize; i++) {
        // A record has to beat the best so far, so a tie doesn't count
        if (count == 0 || highs[i] > highs[records[count - 1]]) {
            records[count++] = i;
        }
    }
    *returnSize = count;
    return records;
}
