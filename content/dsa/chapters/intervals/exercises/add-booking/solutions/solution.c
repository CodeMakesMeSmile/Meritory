#include <stdlib.h>

static void add(int** result, int* columns, int* count, int start, int end) {
    result[*count] = malloc(sizeof(int) * 2);
    result[*count][0] = start;
    result[*count][1] = end;
    columns[*count] = 2;
    (*count)++;
}

int** addBooking(int** diary, int diarySize, int* diaryColSize, int* booking, int bookingSize, int* returnSize, int** returnColumnSizes) {
    // At most every busy time plus the booking
    int** result = malloc(sizeof(int*) * (diarySize + 1));
    *returnColumnSizes = malloc(sizeof(int) * (diarySize + 1));
    int count = 0;
    int start = booking[0];
    int end = booking[1];
    int i = 0;
    // Busy times that end before the booking starts stay as they are
    while (i < diarySize && diary[i][1] < start) {
        add(result, *returnColumnSizes, &count, diary[i][0], diary[i][1]);
        i++;
    }
    // Every busy time that overlaps or touches the booking joins it
    while (i < diarySize && diary[i][0] <= end) {
        if (diary[i][0] < start) start = diary[i][0];
        if (diary[i][1] > end) end = diary[i][1];
        i++;
    }
    add(result, *returnColumnSizes, &count, start, end);
    // The rest start after the booking ends
    while (i < diarySize) {
        add(result, *returnColumnSizes, &count, diary[i][0], diary[i][1]);
        i++;
    }
    *returnSize = count;
    return result;
}
