export function cheapestSwims(days: number[], prices: number[]): number {
  const lastDay = days[days.length - 1];
  const swims = new Set(days);
  // spent[d] is the least spent so every planned day up to day d is covered
  const spent = new Array<number>(lastDay + 1).fill(0);
  for (let d = 1; d <= lastDay; d++) {
    if (!swims.has(d)) {
      // Nothing new to cover today
      spent[d] = spent[d - 1];
      continue;
    }
    // A 1, 7, or 30 day pass ending today, plus the best for the days before it
    spent[d] = Math.min(
      spent[d - 1] + prices[0],
      spent[Math.max(0, d - 7)] + prices[1],
      spent[Math.max(0, d - 30)] + prices[2],
    );
  }
  return spent[lastDay];
}
