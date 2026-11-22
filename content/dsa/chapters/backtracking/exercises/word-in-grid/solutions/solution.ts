export function wordInGrid(grid: string[], word: string): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const used = grid.map((row) => new Array<boolean>(row.length).fill(false));
  const trace = (r: number, c: number, at: number): boolean => {
    if (at === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    // A used cell or a wrong letter ends this path at once
    if (used[r][c] || grid[r][c] !== word[at]) return false;
    used[r][c] = true;
    const found =
      trace(r + 1, c, at + 1) ||
      trace(r - 1, c, at + 1) ||
      trace(r, c + 1, at + 1) ||
      trace(r, c - 1, at + 1);
    // Clearing the mark lets other paths use this cell
    used[r][c] = false;
    return found;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (trace(r, c, 0)) return true;
    }
  }
  return false;
}
