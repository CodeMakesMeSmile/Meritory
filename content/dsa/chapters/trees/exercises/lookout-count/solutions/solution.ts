export function countLookouts(stations: TreeNode | null): number {
  // Each call carries the highest station on the way down from the base
  const count = (node: TreeNode | null, highest: number): number => {
    if (!node) return 0;
    const clear = node.val >= highest ? 1 : 0;
    const next = Math.max(highest, node.val);
    return clear + count(node.left, next) + count(node.right, next);
  };
  return stations ? count(stations, stations.val) : 0;
}
