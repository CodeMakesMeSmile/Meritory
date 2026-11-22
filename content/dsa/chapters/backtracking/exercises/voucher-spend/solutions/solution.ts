export function voucherBaskets(prices: number[], voucher: number): number[][] {
  // Sorting puts equal prices side by side and keeps each basket in order
  const sorted = [...prices].sort((a, b) => a - b);
  const baskets: number[][] = [];
  const path: number[] = [];
  const build = (start: number, left: number): void => {
    if (left === 0) {
      baskets.push([...path]);
      return;
    }
    for (let i = start; i < sorted.length; i++) {
      // Every later price is at least as high, so none of them fit either
      if (sorted[i] > left) break;
      // A second branch at this level with the same price would repeat the first
      if (i > start && sorted[i] === sorted[i - 1]) continue;
      path.push(sorted[i]);
      // Starting after i uses each item at most once
      build(i + 1, left - sorted[i]);
      path.pop();
    }
  };
  build(0, voucher);
  return baskets;
}
