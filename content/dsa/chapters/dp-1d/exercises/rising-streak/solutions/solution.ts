export function longestRise(heights: number[]): number {
  // tails[k] is the lowest height that can end a rise of k + 1 points
  const tails: number[] = [];
  for (const height of heights) {
    // Find the first tail that's at least this height
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (tails[mid] >= height) hi = mid;
      else lo = mid + 1;
    }
    // Extend the longest rise, or give a rise of length lo + 1 a lower end
    tails[lo] = height;
  }
  return tails.length;
}
