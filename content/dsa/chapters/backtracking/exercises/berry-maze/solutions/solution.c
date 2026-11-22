static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

// Returns the most berries a walk can pick from here on, this bush included
static int walk(int** field, int rows, int cols, int r, int c) {
    int here = field[r][c];
    // Setting the bush to 0 marks it as picked, so the walk can't come back
    field[r][c] = 0;
    int best = 0;
    for (int k = 0; k < 4; k++) {
        int nr = r + STEPS[k][0];
        int nc = c + STEPS[k][1];
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && field[nr][nc] > 0) {
            int got = walk(field, rows, cols, nr, nc);
            if (got > best) best = got;
        }
    }
    // Putting the berries back is the undo
    field[r][c] = here;
    return here + best;
}

int mostBerries(int** field, int fieldSize, int* fieldColSize) {
    int cols = fieldColSize[0];
    int most = 0;
    for (int r = 0; r < fieldSize; r++) {
        for (int c = 0; c < cols; c++) {
            if (field[r][c] > 0) {
                int got = walk(field, fieldSize, cols, r, c);
                if (got > most) most = got;
            }
        }
    }
    return most;
}
