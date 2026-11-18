export function balancePoint(weights: number[]): number {
  let right = weights.reduce((sum, weight) => sum + weight, 0);
  let left = 0;
  for (let i = 0; i < weights.length; i++) {
    right -= weights[i];
    if (left === right) return i;
    left += weights[i];
  }
  return -1;
}
