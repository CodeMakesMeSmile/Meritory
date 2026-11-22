export function giftsUnderBudget(prices: number[], budget: number): number {
  let best = -1;
  let left = 0;
  let right = prices.length - 1;
  while (left < right) {
    const total = prices[left] + prices[right];
    if (total <= budget) {
      // This is the best the left gift can do, so record it and move on
      best = Math.max(best, total);
      left++;
    } else {
      right--;
    }
  }
  return best;
}
