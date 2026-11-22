#include <stdlib.h>

int** bothFree(int** first, int firstSize, int* firstColSize, int** second, int secondSize, int* secondColSize, int* returnSize, int** returnColumnSizes) {
    // Each step moves one pointer, so there are at most n + m stretches
    int room = firstSize + secondSize > 0 ? firstSize + secondSize : 1;
    int** both = malloc(sizeof(int*) * room);
    *returnColumnSizes = malloc(sizeof(int) * room);
    int count = 0;
    int i = 0;
    int j = 0;
    while (i < firstSize && j < secondSize) {
        // The two current free times share from the later start to the earlier end
        int start = first[i][0] > second[j][0] ? first[i][0] : second[j][0];
        int end = first[i][1] < second[j][1] ? first[i][1] : second[j][1];
        if (start < end) {
            both[count] = malloc(sizeof(int) * 2);
            both[count][0] = start;
            both[count][1] = end;
            (*returnColumnSizes)[count] = 2;
            count++;
        }
        // Whichever ends first can't share time with anything later in the other list
        if (first[i][1] < second[j][1]) {
            i++;
        } else {
            j++;
        }
    }
    *returnSize = count;
    return both;
}
