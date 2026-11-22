const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function hoursToFrost(tray: number[][]): number {
  const rows = tray.length;
  const cols = tray[0].length;
  // hour[r][c] is when the cell frosted over, or -1 while it hasn't
  const hour = tray.map((row) => row.map(() => -1));
  const queue: number[][] = [];
  let healthy = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Every frosted seedling starts in the queue at hour 0, so they all spread together
      if (tray[r][c] === 2) {
        hour[r][c] = 0;
        queue.push([r, c]);
      } else if (tray[r][c] === 1) {
        healthy++;
      }
    }
  }
  let latest = 0;
  for (let head = 0; head < queue.length; head++) {
    const [row, col] = queue[head];
    for (const [dr, dc] of STEPS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (tray[nr][nc] === 1 && hour[nr][nc] === -1) {
        hour[nr][nc] = hour[row][col] + 1;
        latest = hour[nr][nc];
        healthy--;
        queue.push([nr, nc]);
      }
    }
  }
  return healthy === 0 ? latest : -1;
}
