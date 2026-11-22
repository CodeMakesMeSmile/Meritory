#include <stdbool.h>

bool inCatalogue(int** grid, int gridSize, int* gridColSize, int target) {
    int cols = gridColSize[0];
    int size = gridSize * cols;
    int lo = 0;
    int hi = size;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        // Position mid in reading order is in row mid / cols, column mid % cols
        if (grid[mid / cols][mid % cols] >= target) hi = mid;
        else lo = mid + 1;
    }
    return lo < size && grid[lo / cols][lo % cols] == target;
}
