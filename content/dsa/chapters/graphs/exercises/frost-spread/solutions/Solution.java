import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Queue;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int hoursToFrost(int[][] tray) {
        int rows = tray.length;
        int cols = tray[0].length;
        // hour[r][c] is when the cell frosted over, or -1 while it hasn't
        int[][] hour = new int[rows][cols];
        for (int[] row : hour) Arrays.fill(row, -1);
        Queue<int[]> queue = new ArrayDeque<>();
        int healthy = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                // Every frosted seedling starts in the queue at hour 0, so they all spread together
                if (tray[r][c] == 2) {
                    hour[r][c] = 0;
                    queue.offer(new int[] {r, c});
                } else if (tray[r][c] == 1) {
                    healthy++;
                }
            }
        }
        int latest = 0;
        while (!queue.isEmpty()) {
            int[] at = queue.poll();
            for (int[] step : STEPS) {
                int nr = at[0] + step[0];
                int nc = at[1] + step[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                if (tray[nr][nc] == 1 && hour[nr][nc] == -1) {
                    hour[nr][nc] = hour[at[0]][at[1]] + 1;
                    latest = hour[nr][nc];
                    healthy--;
                    queue.offer(new int[] {nr, nc});
                }
            }
        }
        return healthy == 0 ? latest : -1;
    }
}
