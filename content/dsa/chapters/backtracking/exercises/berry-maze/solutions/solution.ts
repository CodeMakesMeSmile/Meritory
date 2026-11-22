export function mostBerries(field: number[][]): number {
  const rows = field.length;
  const cols = field[0].length;
  const steps = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  // Returns the most berries a walk can pick from here on, this bush included
  const walk = (r: number, c: number): number => {
    const here = field[r][c];
    // Setting the bush to 0 marks it as picked, so the walk can't come back
    field[r][c] = 0;
    let best = 0;
    for (const [dr, dc] of steps) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && field[nr][nc] > 0) {
        best = Math.max(best, walk(nr, nc));
      }
    }
    // Putting the berries back is the undo
    field[r][c] = here;
    return here + best;
  };
  let most = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (field[r][c] > 0) most = Math.max(most, walk(r, c));
    }
  }
  return most;
}
