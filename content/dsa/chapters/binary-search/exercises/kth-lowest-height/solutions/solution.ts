export function kthLowest(heights: number[][], k: number): number {
  const rows = heights.length;
  const cols = heights[0].length;
  // How many heights are at most limit, walking left from the top right as the rows go down
  const countAtMost = (limit: number): number => {
    let count = 0;
    let col = cols - 1;
    for (let row = 0; row < rows; row++) {
      while (col >= 0 && heights[row][col] > limit) col--;
      count += col + 1;
    }
    return count;
  };
  // Every height before lo has fewer than k at or below it, and every one from hi on has k or more
  let lo = heights[0][0];
  let hi = heights[rows - 1][cols - 1];
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (countAtMost(mid) >= k) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
