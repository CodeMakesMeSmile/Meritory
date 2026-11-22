export function richestRoute(mine: TreeNode | null): number {
  let best = (mine as TreeNode).val;
  // Returns the best value of a route that starts here and only goes down
  const gain = (node: TreeNode | null): number => {
    if (!node) return 0;
    // A side that only costs is better left off
    const left = Math.max(0, gain(node.left));
    const right = Math.max(0, gain(node.right));
    // A route that bends here can use both sides, but a parent can only extend one
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  };
  gain(mine);
  return best;
}
