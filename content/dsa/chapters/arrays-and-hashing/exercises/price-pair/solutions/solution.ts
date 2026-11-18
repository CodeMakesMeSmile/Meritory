export function pricePair(prices: number[], target: number): number[] {
  const firstSeen = new Map<number, number>();
  for (let j = 0; j < prices.length; j++) {
    const partner = firstSeen.get(target - prices[j]);
    if (partner !== undefined) return [partner, j];
    if (!firstSeen.has(prices[j])) firstSeen.set(prices[j], j);
  }
  return [];
}
