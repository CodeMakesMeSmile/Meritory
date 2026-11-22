export function bandTotal(
  prices: TreeNode | null,
  low: number,
  high: number,
): number {
  if (!prices) return 0;
  // Everything on the left is lower still, so only the right can be in the band
  if (prices.val < low) return bandTotal(prices.right, low, high);
  // Everything on the right is higher still, so only the left can be in the band
  if (prices.val > high) return bandTotal(prices.left, low, high);
  return (
    prices.val +
    bandTotal(prices.left, low, high) +
    bandTotal(prices.right, low, high)
  );
}
