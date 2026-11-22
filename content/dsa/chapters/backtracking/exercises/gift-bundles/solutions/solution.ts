export function giftBundles(prices: number[]): number[][] {
  // Sorting puts equal prices side by side and keeps each bundle in order
  const sorted = [...prices].sort((a, b) => a - b);
  const bundles: number[][] = [];
  const path: number[] = [];
  const build = (start: number): void => {
    bundles.push([...path]);
    for (let i = start; i < sorted.length; i++) {
      // A second branch at this level with the same price would repeat the first
      if (i > start && sorted[i] === sorted[i - 1]) continue;
      path.push(sorted[i]);
      build(i + 1);
      path.pop();
    }
  };
  build(0);
  return bundles;
}
