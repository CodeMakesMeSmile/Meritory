export function priceSpans(prices: number[]): number[] {
  const spans: number[] = [];
  // Earlier days that could still end a span, with prices falling from bottom to top
  const higher: number[] = [];
  for (let day = 0; day < prices.length; day++) {
    while (
      higher.length > 0 &&
      prices[higher[higher.length - 1]] <= prices[day]
    ) {
      higher.pop();
    }
    // The day left on top is the last one with a higher price
    const stop = higher.length > 0 ? higher[higher.length - 1] : -1;
    spans.push(day - stop);
    higher.push(day);
  }
  return spans;
}
