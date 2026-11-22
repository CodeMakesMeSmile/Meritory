import java.util.Arrays;
import java.util.PriorityQueue;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int gentlestClimb(int[][] heights) {
        int rows = heights.length;
        int cols = heights[0].length;
        // strain[r][c] holds the gentlest route to that cell so far
        int[][] strain = new int[rows][cols];
        for (int[] row : strain) Arrays.fill(row, Integer.MAX_VALUE);
        strain[0][0] = 0;
        // Each entry is {strain, row, col}, with the gentlest on top
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[] {0, 0, 0});
        while (!heap.isEmpty()) {
            int[] entry = heap.poll();
            int at = entry[0];
            int row = entry[1];
            int col = entry[2];
            // A stale entry, since this cell was already settled by a gentler route
            if (at > strain[row][col]) continue;
            // The first time the far corner comes out, its strain is final
            if (row == rows - 1 && col == cols - 1) return at;
            for (int[] step : STEPS) {
                int nr = row + step[0];
                int nc = col + step[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                // A route's strain is its hardest step, so take the larger instead of adding
                int through = Math.max(at, Math.abs(heights[nr][nc] - heights[row][col]));
                if (through < strain[nr][nc]) {
                    strain[nr][nc] = through;
                    heap.offer(new int[] {through, nr, nc});
                }
            }
        }
        return strain[rows - 1][cols - 1];
    }
}
