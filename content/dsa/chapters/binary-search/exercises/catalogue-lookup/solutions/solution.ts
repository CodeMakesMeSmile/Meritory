export function inCatalogue(grid: number[][], target: number): boolean {
  const cols = grid[0].length;
  const size = grid.length * cols;
  // Position i in reading order is in row i / cols, column i % cols
  const at = (i: number): number => grid[Math.floor(i / cols)][i % cols];
  let lo = 0;
  let hi = size;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (at(mid) >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo < size && at(lo) === target;
}
