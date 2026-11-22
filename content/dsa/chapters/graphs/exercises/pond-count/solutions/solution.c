#include <stdbool.h>
#include <stdlib.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

int pondCount(int** marsh, int marshSize, int* marshColSize) {
    int rows = marshSize;
    int cols = marshColSize[0];
    // Cell (r, c) is number r * cols + c, so one flat array covers the grid
    bool* seen = calloc(rows * cols, sizeof(bool));
    // Each cell goes on the stack at most once, so rows * cols slots are enough
    int* stack = malloc(sizeof(int) * rows * cols);
    int ponds = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (marsh[r][c] != 1 || seen[r * cols + c]) continue;
            // Unseen water starts a new pond, and the walk marks all of it
            ponds++;
            seen[r * cols + c] = true;
            int top = 0;
            stack[top++] = r * cols + c;
            while (top > 0) {
                int at = stack[--top];
                for (int s = 0; s < 4; s++) {
                    int nr = at / cols + STEPS[s][0];
                    int nc = at % cols + STEPS[s][1];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    if (marsh[nr][nc] == 1 && !seen[nr * cols + nc]) {
                        seen[nr * cols + nc] = true;
                        stack[top++] = nr * cols + nc;
                    }
                }
            }
        }
    }
    free(seen);
    free(stack);
    return ponds;
}
