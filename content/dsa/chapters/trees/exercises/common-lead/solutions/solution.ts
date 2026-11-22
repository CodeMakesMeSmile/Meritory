// Returns a, b, or their closest shared lead, whichever this branch turns up, or null
function lowest(node: TreeNode | null, a: number, b: number): TreeNode | null {
  if (!node || node.val === a || node.val === b) return node;
  const left = lowest(node.left, a, b);
  const right = lowest(node.right, a, b);
  // One found on each side means their paths split here
  if (left && right) return node;
  return left ?? right;
}

export function commonLead(
  team: TreeNode | null,
  a: number,
  b: number,
): number {
  return (lowest(team, a, b) as TreeNode).val;
}
