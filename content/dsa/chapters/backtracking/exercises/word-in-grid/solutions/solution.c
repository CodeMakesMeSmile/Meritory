#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char** grid;
    int rows;
    int cols;
    const char* word;
    int length;
    bool* used;
} Search;

static bool trace(Search* s, int r, int c, int at) {
    if (at == s->length) return true;
    if (r < 0 || c < 0 || r >= s->rows || c >= s->cols) return false;
    // A used cell or a wrong letter ends this path at once
    if (s->used[r * s->cols + c] || s->grid[r][c] != s->word[at]) return false;
    s->used[r * s->cols + c] = true;
    bool found = trace(s, r + 1, c, at + 1) || trace(s, r - 1, c, at + 1) ||
                 trace(s, r, c + 1, at + 1) || trace(s, r, c - 1, at + 1);
    // Clearing the mark lets other paths use this cell
    s->used[r * s->cols + c] = false;
    return found;
}

bool wordInGrid(char** grid, int gridSize, char* word) {
    Search s = {grid, gridSize, (int)strlen(grid[0]), word, (int)strlen(word), NULL};
    s.used = calloc(s.rows * s.cols, sizeof(bool));
    bool found = false;
    for (int r = 0; r < s.rows && !found; r++) {
        for (int c = 0; c < s.cols && !found; c++) {
            found = trace(&s, r, c, 0);
        }
    }
    free(s.used);
    return found;
}
