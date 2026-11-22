#include <stdlib.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

int** exitDistances(int** plan, int planSize, int* planColSize, int* returnSize, int** returnColumnSizes) {
    int rows = planSize;
    int cols = planColSize[0];
    // Walls and cells no exit reaches keep -1
    int** distance = malloc(sizeof(int*) * rows);
    *returnColumnSizes = malloc(sizeof(int) * rows);
    *returnSize = rows;
    // Cell (r, c) is number r * cols + c, and each joins the queue at most once
    int* queue = malloc(sizeof(int) * rows * cols);
    int head = 0;
    int tail = 0;
    for (int r = 0; r < rows; r++) {
        distance[r] = malloc(sizeof(int) * cols);
        (*returnColumnSizes)[r] = cols;
        for (int c = 0; c < cols; c++) {
            distance[r][c] = -1;
            // Every exit starts in the queue at 0, so each cell is first reached from its nearest exit
            if (plan[r][c] == 2) {
                distance[r][c] = 0;
                queue[tail++] = r * cols + c;
            }
        }
    }
    while (head < tail) {
        int at = queue[head++];
        int row = at / cols;
        int col = at % cols;
        for (int s = 0; s < 4; s++) {
            int nr = row + STEPS[s][0];
            int nc = col + STEPS[s][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (plan[nr][nc] == 0 && distance[nr][nc] == -1) {
                distance[nr][nc] = distance[row][col] + 1;
                queue[tail++] = nr * cols + nc;
            }
        }
    }
    free(queue);
    return distance;
}
