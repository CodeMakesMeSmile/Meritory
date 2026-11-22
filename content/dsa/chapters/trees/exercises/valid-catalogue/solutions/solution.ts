// Every number in this branch must be strictly between low and high, where null means no limit
function valid(
  node: TreeNode | null,
  low: number | null,
  high: number | null,
): boolean {
  if (!node) return true;
  if (low !== null && node.val <= low) return false;
  if (high !== null && node.val >= high) return false;
  return valid(node.left, low, node.val) && valid(node.right, node.val, high);
}

export function isSearchTree(index: TreeNode | null): boolean {
  return valid(index, null, null);
}
