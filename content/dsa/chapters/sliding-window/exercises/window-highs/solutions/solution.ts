export function windowHighs(prices: number[], k: number): number[] {
  // Positions whose prices get smaller from front to back, with head as the front
  const deque: number[] = [];
  let head = 0;
  const highs: number[] = [];
  for (let right = 0; right < prices.length; right++) {
    // An older price no higher than this one can never be a high again
    while (
      deque.length > head &&
      prices[deque[deque.length - 1]] <= prices[right]
    ) {
      deque.pop();
    }
    deque.push(right);
    if (deque[head] <= right - k) head++;
    if (right >= k - 1) highs.push(prices[deque[head]]);
  }
  return highs;
}
