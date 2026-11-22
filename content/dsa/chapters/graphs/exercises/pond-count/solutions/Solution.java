import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int pondCount(int[][] marsh) {
        int rows = marsh.length;
        int cols = marsh[0].length;
        boolean[][] seen = new boolean[rows][cols];
        int ponds = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (marsh[r][c] != 1 || seen[r][c]) continue;
                // Unseen water starts a new pond, and the walk marks all of it
                ponds++;
                seen[r][c] = true;
                // Our own stack instead of recursion, since one pond can cover the whole marsh
                Deque<int[]> stack = new ArrayDeque<>();
                stack.push(new int[] {r, c});
                while (!stack.isEmpty()) {
                    int[] at = stack.pop();
                    for (int[] step : STEPS) {
                        int nr = at[0] + step[0];
                        int nc = at[1] + step[1];
                        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                        if (marsh[nr][nc] == 1 && !seen[nr][nc]) {
                            seen[nr][nc] = true;
                            stack.push(new int[] {nr, nc});
                        }
                    }
                }
            }
        }
        return ponds;
    }
}
