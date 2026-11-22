const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function fewestSteps(yard: number[][]): number {
  const rows = yard.length;
  const cols = yard[0].length;
  if (yard[0][0] === 1 || yard[rows - 1][cols - 1] === 1) return -1;
  // steps[r][c] stays -1 until the cell is first reached, which is by the fewest steps
  const steps = yard.map((row) => row.map(() => -1));
  steps[0][0] = 0;
  const queue = [[0, 0]];
  for (let head = 0; head < queue.length; head++) {
    const [row, col] = queue[head];
    if (row === rows - 1 && col === cols - 1) return steps[row][col];
    for (const [dr, dc] of STEPS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      // Marking a cell as it joins the queue keeps it from joining twice
      if (yard[nr][nc] === 0 && steps[nr][nc] === -1) {
        steps[nr][nc] = steps[row][col] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return -1;
}
