#include <stdlib.h>
#include <string.h>

int* groupSizes(char* labels, int* returnSize) {
    int n = (int)strlen(labels);
    // Where each van's last parcel sits
    int last[26] = {0};
    for (int i = 0; i < n; i++) last[labels[i] - 'a'] = i;
    int* sizes = malloc(sizeof(int) * (n > 0 ? n : 1));
    int count = 0;
    int groupStart = 0;
    int groupEnd = 0;
    for (int i = 0; i < n; i++) {
        // The group has to reach this van's last parcel
        if (last[labels[i] - 'a'] > groupEnd) groupEnd = last[labels[i] - 'a'];
        // Every van in the group is finished here, so cut as early as possible
        if (i == groupEnd) {
            sizes[count++] = i - groupStart + 1;
            groupStart = i + 1;
        }
    }
    *returnSize = count;
    return sizes;
}
