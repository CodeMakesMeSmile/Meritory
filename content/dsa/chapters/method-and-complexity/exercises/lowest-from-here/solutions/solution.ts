export function lowestFromHere(prices: number[]): number[] {
  const days: number[] = [];
  let lowest = Infinity;
  // Walk from the end, keeping the lowest price seen after each day
  for (let i = prices.length - 1; i >= 0; i--) {
    if (prices[i] < lowest) {
      days.push(i);
      lowest = prices[i];
    }
  }
  // The days were found last to first, and one reverse is O(n)
  return days.reverse();
}
