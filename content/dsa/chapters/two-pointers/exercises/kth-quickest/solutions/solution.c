#include <stdlib.h>
#include <string.h>

static void swap(int* order, int a, int b) {
    int held = order[a];
    order[a] = order[b];
    order[b] = held;
}

int kthQuickest(int* times, int timesSize, int k) {
    int* order = malloc(sizeof(int) * timesSize);
    memcpy(order, times, sizeof(int) * timesSize);
    int want = k - 1;
    int start = 0;
    int end = timesSize - 1;
    while (start < end) {
        int pivot = order[start + rand() % (end - start + 1)];
        // Split into below, equal to, and above the pivot, as with three sizes
        int low = start;
        int mid = start;
        int high = end;
        while (mid <= high) {
            if (order[mid] < pivot) {
                swap(order, low, mid);
                low++;
                mid++;
            } else if (order[mid] > pivot) {
                swap(order, mid, high);
                high--;
            } else {
                mid++;
            }
        }
        // Keep going only on the side that holds position k
        if (want < low) {
            end = low - 1;
        } else if (want > high) {
            start = high + 1;
        } else {
            // Every value from low to high equals the pivot, so stop there
            start = end = want;
        }
    }
    int answer = order[start];
    free(order);
    return answer;
}
