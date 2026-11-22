export function biggestBanner(heights: number[]): number {
  let best = 0;
  let left = 0;
  let right = heights.length - 1;
  while (left < right) {
    const height = Math.min(heights[left], heights[right]);
    best = Math.max(best, height * (right - left));
    // Any closer partner for the shorter post makes a smaller banner
    if (heights[left] < heights[right]) left++;
    else right--;
  }
  return best;
}
