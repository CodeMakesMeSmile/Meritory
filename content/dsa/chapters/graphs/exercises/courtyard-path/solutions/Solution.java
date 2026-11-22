import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Queue;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int fewestSteps(int[][] yard) {
        int rows = yard.length;
        int cols = yard[0].length;
        if (yard[0][0] == 1 || yard[rows - 1][cols - 1] == 1) return -1;
        // steps[r][c] stays -1 until the cell is first reached, which is by the fewest steps
        int[][] steps = new int[rows][cols];
        for (int[] row : steps) Arrays.fill(row, -1);
        steps[0][0] = 0;
        Queue<int[]> queue = new ArrayDeque<>();
        queue.offer(new int[] {0, 0});
        while (!queue.isEmpty()) {
            int[] at = queue.poll();
            if (at[0] == rows - 1 && at[1] == cols - 1) return steps[at[0]][at[1]];
            for (int[] step : STEPS) {
                int nr = at[0] + step[0];
                int nc = at[1] + step[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                // Marking a cell as it joins the queue keeps it from joining twice
                if (yard[nr][nc] == 0 && steps[nr][nc] == -1) {
                    steps[nr][nc] = steps[at[0]][at[1]] + 1;
                    queue.offer(new int[] {nr, nc});
                }
            }
        }
        return -1;
    }
}
