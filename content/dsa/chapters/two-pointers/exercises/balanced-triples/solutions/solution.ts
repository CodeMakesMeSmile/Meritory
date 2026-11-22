export function balancedTriples(amounts: number[]): number[][] {
  const sorted = [...amounts].sort((a, b) => a - b);
  const found: number[][] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    // A repeated first amount would find the same sets again
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum < 0) {
        left++;
      } else if (sum > 0) {
        right--;
      } else {
        found.push([sorted[i], sorted[left], sorted[right]]);
        left++;
        right--;
        while (left < right && sorted[left] === sorted[left - 1]) left++;
      }
    }
  }
  return found;
}
