const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function pondCount(marsh: number[][]): number {
  const rows = marsh.length;
  const cols = marsh[0].length;
  const seen = marsh.map((row) => row.map(() => false));
  let ponds = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (marsh[r][c] !== 1 || seen[r][c]) continue;
      // Unseen water starts a new pond, and the walk marks all of it
      ponds++;
      seen[r][c] = true;
      // Our own stack instead of recursion, since one pond can cover the whole marsh
      const stack = [[r, c]];
      while (stack.length > 0) {
        const [row, col] = stack.pop() as number[];
        for (const [dr, dc] of STEPS) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (marsh[nr][nc] === 1 && !seen[nr][nc]) {
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
    }
  }
  return ponds;
}
