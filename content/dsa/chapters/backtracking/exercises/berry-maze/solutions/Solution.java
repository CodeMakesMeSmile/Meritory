class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int mostBerries(int[][] field) {
        int most = 0;
        for (int r = 0; r < field.length; r++) {
            for (int c = 0; c < field[0].length; c++) {
                if (field[r][c] > 0) most = Math.max(most, walk(field, r, c));
            }
        }
        return most;
    }

    // Returns the most berries a walk can pick from here on, this bush included
    private int walk(int[][] field, int r, int c) {
        int here = field[r][c];
        // Setting the bush to 0 marks it as picked, so the walk can't come back
        field[r][c] = 0;
        int best = 0;
        for (int[] step : STEPS) {
            int nr = r + step[0];
            int nc = c + step[1];
            if (nr >= 0 && nc >= 0 && nr < field.length && nc < field[0].length && field[nr][nc] > 0) {
                best = Math.max(best, walk(field, nr, nc));
            }
        }
        // Putting the berries back is the undo
        field[r][c] = here;
        return here + best;
    }
}
