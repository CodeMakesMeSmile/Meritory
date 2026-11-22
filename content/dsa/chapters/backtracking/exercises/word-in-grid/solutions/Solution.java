class Solution {
    public boolean wordInGrid(String[] grid, String word) {
        boolean[][] used = new boolean[grid.length][grid[0].length()];
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length(); c++) {
                if (trace(grid, word, used, r, c, 0)) return true;
            }
        }
        return false;
    }

    private boolean trace(String[] grid, String word, boolean[][] used, int r, int c, int at) {
        if (at == word.length()) return true;
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length()) return false;
        // A used cell or a wrong letter ends this path at once
        if (used[r][c] || grid[r].charAt(c) != word.charAt(at)) return false;
        used[r][c] = true;
        boolean found = trace(grid, word, used, r + 1, c, at + 1)
                || trace(grid, word, used, r - 1, c, at + 1)
                || trace(grid, word, used, r, c + 1, at + 1)
                || trace(grid, word, used, r, c - 1, at + 1);
        // Clearing the mark lets other paths use this cell
        used[r][c] = false;
        return found;
    }
}
