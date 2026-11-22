const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function exitDistances(plan: number[][]): number[][] {
  const rows = plan.length;
  const cols = plan[0].length;
  // Walls and cells no exit reaches keep -1
  const distance = plan.map((row) => row.map(() => -1));
  const queue: number[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Every exit starts in the queue at 0, so each cell is first reached from its nearest exit
      if (plan[r][c] === 2) {
        distance[r][c] = 0;
        queue.push([r, c]);
      }
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const [row, col] = queue[head];
    for (const [dr, dc] of STEPS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (plan[nr][nc] === 0 && distance[nr][nc] === -1) {
        distance[nr][nc] = distance[row][col] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return distance;
}
