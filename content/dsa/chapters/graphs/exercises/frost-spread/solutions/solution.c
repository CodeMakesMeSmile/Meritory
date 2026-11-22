#include <stdlib.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

int hoursToFrost(int** tray, int traySize, int* trayColSize) {
    int rows = traySize;
    int cols = trayColSize[0];
    // Cell (r, c) is number r * cols + c, and hour stays -1 until the cell frosts over
    int* hour = malloc(sizeof(int) * rows * cols);
    // Each cell joins the queue at most once, so rows * cols slots are enough
    int* queue = malloc(sizeof(int) * rows * cols);
    int head = 0;
    int tail = 0;
    int healthy = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            hour[r * cols + c] = -1;
            // Every frosted seedling starts in the queue at hour 0, so they all spread together
            if (tray[r][c] == 2) {
                hour[r * cols + c] = 0;
                queue[tail++] = r * cols + c;
            } else if (tray[r][c] == 1) {
                healthy++;
            }
        }
    }
    int latest = 0;
    while (head < tail) {
        int at = queue[head++];
        for (int s = 0; s < 4; s++) {
            int nr = at / cols + STEPS[s][0];
            int nc = at % cols + STEPS[s][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int next = nr * cols + nc;
            if (tray[nr][nc] == 1 && hour[next] == -1) {
                hour[next] = hour[at] + 1;
                latest = hour[next];
                healthy--;
                queue[tail++] = next;
            }
        }
    }
    free(hour);
    free(queue);
    return healthy == 0 ? latest : -1;
}
