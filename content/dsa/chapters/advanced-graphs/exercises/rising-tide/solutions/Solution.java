import java.util.Arrays;
import java.util.PriorityQueue;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int earliestHour(int[][] field) {
        int rows = field.length;
        int cols = field[0].length;
        // hour[r][c] holds the earliest the boat can be in that cell so far
        int[][] hour = new int[rows][cols];
        for (int[] row : hour) Arrays.fill(row, Integer.MAX_VALUE);
        // The boat needs water in the starting cell too
        hour[0][0] = field[0][0];
        // Each entry is {hour, row, col}, with the earliest on top
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[] {field[0][0], 0, 0});
        while (!heap.isEmpty()) {
            int[] entry = heap.poll();
            int at = entry[0];
            int row = entry[1];
            int col = entry[2];
            // A stale entry, since this cell was already settled at an earlier hour
            if (at > hour[row][col]) continue;
            // The first time the far corner comes out, its hour is final
            if (row == rows - 1 && col == cols - 1) return at;
            for (int[] step : STEPS) {
                int nr = row + step[0];
                int nc = col + step[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                // The wait is set by the highest cell on the way, so take the larger instead of adding
                int through = Math.max(at, field[nr][nc]);
                if (through < hour[nr][nc]) {
                    hour[nr][nc] = through;
                    heap.offer(new int[] {through, nr, nc});
                }
            }
        }
        return hour[rows - 1][cols - 1];
    }
}
