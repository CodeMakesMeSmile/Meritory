#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

int fewestDrifts(int** field, int fieldSize, int* fieldColSize) {
    int rows = fieldSize;
    int cols = fieldColSize[0];
    int cells = rows * cols;
    // Cell (r, c) is number r * cols + c, and entering it costs its own value
    int* drifts = malloc(sizeof(int) * cells);
    for (int i = 0; i < cells; i++) drifts[i] = INT_MAX;
    bool* done = calloc(cells, sizeof(bool));
    drifts[0] = field[0][0];
    // A deque as a ring buffer: each cell adds at most 4 entries, so this many slots never fill
    int size = 4 * cells + 1;
    int* deque = malloc(sizeof(int) * size);
    int head = 0;
    int count = 1;
    deque[0] = 0;
    while (count > 0) {
        int at = deque[head];
        head = (head + 1) % size;
        count--;
        // A cell can be added more than once, and only its first time out counts
        if (done[at]) continue;
        done[at] = true;
        for (int s = 0; s < 4; s++) {
            int nr = at / cols + STEPS[s][0];
            int nc = at % cols + STEPS[s][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int next = nr * cols + nc;
            int cost = field[nr][nc];
            if (drifts[at] + cost < drifts[next]) {
                drifts[next] = drifts[at] + cost;
                if (cost == 0) {
                    // A clear cell costs no more, so it goes to the front
                    head = (head - 1 + size) % size;
                    deque[head] = next;
                } else {
                    // A drift costs one more, so it waits at the back
                    deque[(head + count) % size] = next;
                }
                count++;
            }
        }
    }
    int answer = drifts[cells - 1];
    free(drifts);
    free(done);
    free(deque);
    return answer;
}
