import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Deque;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int fewestDrifts(int[][] field) {
        int rows = field.length;
        int cols = field[0].length;
        // Entering a cell costs its own value, and the plough clears its starting cell too
        int[][] drifts = new int[rows][cols];
        for (int[] row : drifts) Arrays.fill(row, Integer.MAX_VALUE);
        boolean[][] done = new boolean[rows][cols];
        drifts[0][0] = field[0][0];
        Deque<int[]> cells = new ArrayDeque<>();
        cells.offerFirst(new int[] {0, 0});
        while (!cells.isEmpty()) {
            int[] at = cells.pollFirst();
            int row = at[0];
            int col = at[1];
            // A cell can be added more than once, and only its first time out counts
            if (done[row][col]) continue;
            done[row][col] = true;
            for (int[] step : STEPS) {
                int nr = row + step[0];
                int nc = col + step[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                int cost = field[nr][nc];
                if (drifts[row][col] + cost < drifts[nr][nc]) {
                    drifts[nr][nc] = drifts[row][col] + cost;
                    // A clear cell costs no more, so it goes to the front, and a drift waits at the back
                    if (cost == 0) {
                        cells.offerFirst(new int[] {nr, nc});
                    } else {
                        cells.offerLast(new int[] {nr, nc});
                    }
                }
            }
        }
        return drifts[rows - 1][cols - 1];
    }
}
