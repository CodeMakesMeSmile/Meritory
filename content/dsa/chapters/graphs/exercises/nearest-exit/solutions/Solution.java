import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Queue;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int[][] exitDistances(int[][] plan) {
        int rows = plan.length;
        int cols = plan[0].length;
        // Walls and cells no exit reaches keep -1
        int[][] distance = new int[rows][cols];
        for (int[] row : distance) Arrays.fill(row, -1);
        Queue<int[]> queue = new ArrayDeque<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                // Every exit starts in the queue at 0, so each cell is first reached from its nearest exit
                if (plan[r][c] == 2) {
                    distance[r][c] = 0;
                    queue.offer(new int[] {r, c});
                }
            }
        }
        while (!queue.isEmpty()) {
            int[] at = queue.poll();
            for (int[] step : STEPS) {
                int nr = at[0] + step[0];
                int nc = at[1] + step[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                if (plan[nr][nc] == 0 && distance[nr][nc] == -1) {
                    distance[nr][nc] = distance[at[0]][at[1]] + 1;
                    queue.offer(new int[] {nr, nc});
                }
            }
        }
        return distance;
    }
}
