#include <stdlib.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

int fewestSteps(int** yard, int yardSize, int* yardColSize) {
    int rows = yardSize;
    int cols = yardColSize[0];
    if (yard[0][0] == 1 || yard[rows - 1][cols - 1] == 1) return -1;
    // Cell (r, c) is number r * cols + c, and steps stays -1 until the cell is first reached
    int* steps = malloc(sizeof(int) * rows * cols);
    for (int i = 0; i < rows * cols; i++) steps[i] = -1;
    steps[0] = 0;
    // Each cell joins the queue at most once, so rows * cols slots are enough
    int* queue = malloc(sizeof(int) * rows * cols);
    int head = 0;
    int tail = 0;
    queue[tail++] = 0;
    int goal = rows * cols - 1;
    int answer = -1;
    while (head < tail) {
        int at = queue[head++];
        if (at == goal) {
            answer = steps[at];
            break;
        }
        for (int s = 0; s < 4; s++) {
            int nr = at / cols + STEPS[s][0];
            int nc = at % cols + STEPS[s][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int next = nr * cols + nc;
            // Marking a cell as it joins the queue keeps it from joining twice
            if (yard[nr][nc] == 0 && steps[next] == -1) {
                steps[next] = steps[at] + 1;
                queue[tail++] = next;
            }
        }
    }
    free(steps);
    free(queue);
    return answer;
}
