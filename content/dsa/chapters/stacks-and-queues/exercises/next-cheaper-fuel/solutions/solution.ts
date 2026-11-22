export function nextCheaper(prices: number[]): number[] {
  const cheaper = new Array<number>(prices.length).fill(-1);
  // Days still waiting for a cheaper price, with prices that never fall from bottom to top
  const waiting: number[] = [];
  for (let day = 0; day < prices.length; day++) {
    while (
      waiting.length > 0 &&
      prices[waiting[waiting.length - 1]] > prices[day]
    ) {
      cheaper[waiting.pop() as number] = prices[day];
    }
    waiting.push(day);
  }
  return cheaper;
}
