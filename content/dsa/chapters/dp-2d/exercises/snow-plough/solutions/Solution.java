class Solution {
    public int fewestMinutes(int[][] snow) {
        int rows = snow.length;
        int cols = snow[0].length;
        // fewest[r][c] is the quickest lane from the top left to square (r, c), both included
        int[][] fewest = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) {
                    fewest[r][c] = snow[r][c];
                    continue;
                }
                // The plough came from above or from the left, and a square off the grid is never picked
                int above = r > 0 ? fewest[r - 1][c] : Integer.MAX_VALUE;
                int left = c > 0 ? fewest[r][c - 1] : Integer.MAX_VALUE;
                fewest[r][c] = snow[r][c] + Math.min(above, left);
            }
        }
        return fewest[rows - 1][cols - 1];
    }
}
