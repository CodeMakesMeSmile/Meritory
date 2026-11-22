export function longestTrail(trails: TreeNode | null): number {
  let best = 0;
  // Returns how many junctions deep this branch goes, and records the best bend on the way
  const depth = (node: TreeNode | null): number => {
    if (!node) return 0;
    const left = depth(node.left);
    const right = depth(node.right);
    best = Math.max(best, left + right);
    return 1 + Math.max(left, right);
  };
  depth(trails);
  return best;
}
