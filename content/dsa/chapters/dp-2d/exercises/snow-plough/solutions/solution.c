#include <limits.h>
#include <stdlib.h>

int fewestMinutes(int** snow, int snowSize, int* snowColSize) {
    int rows = snowSize;
    int cols = snowColSize[0];
    // fewest[r * cols + c] is the quickest lane from the top left to square (r, c), both included
    int* fewest = malloc(sizeof(int) * rows * cols);
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (r == 0 && c == 0) {
                fewest[0] = snow[0][0];
                continue;
            }
            // The plough came from above or from the left, and a square off the grid is never picked
            int above = r > 0 ? fewest[(r - 1) * cols + c] : INT_MAX;
            int left = c > 0 ? fewest[r * cols + c - 1] : INT_MAX;
            fewest[r * cols + c] = snow[r][c] + (above < left ? above : left);
        }
    }
    int answer = fewest[rows * cols - 1];
    free(fewest);
    return answer;
}
