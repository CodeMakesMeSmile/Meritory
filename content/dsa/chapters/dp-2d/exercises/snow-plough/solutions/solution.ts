export function fewestMinutes(snow: number[][]): number {
  const rows = snow.length;
  const cols = snow[0].length;
  // fewest[r][c] is the quickest lane from the top left to square (r, c), both included
  const fewest = snow.map((row) => new Array<number>(row.length).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c === 0) {
        fewest[r][c] = snow[r][c];
        continue;
      }
      // The plough came from above or from the left, and a square off the grid is never picked
      const above = r > 0 ? fewest[r - 1][c] : Infinity;
      const left = c > 0 ? fewest[r][c - 1] : Infinity;
      fewest[r][c] = snow[r][c] + Math.min(above, left);
    }
  }
  return fewest[rows - 1][cols - 1];
}
