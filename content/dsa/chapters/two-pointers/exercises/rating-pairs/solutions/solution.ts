export function ratingPairs(ratings: number[], target: number): number[][] {
  const sorted = [...ratings].sort((a, b) => a - b);
  const pairs: number[][] = [];
  let left = 0;
  let right = sorted.length - 1;
  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum < target) {
      left++;
    } else if (sum > target) {
      right--;
    } else {
      pairs.push([sorted[left], sorted[right]]);
      left++;
      right--;
      // Copies of the rating just used would make the same pair again
      while (left < right && sorted[left] === sorted[left - 1]) left++;
    }
  }
  return pairs;
}
