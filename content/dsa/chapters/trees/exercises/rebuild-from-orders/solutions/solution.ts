export function rebuildTree(
  preorder: number[],
  inorder: number[],
): TreeNode | null {
  const where = new Map<number, number>();
  for (let i = 0; i < inorder.length; i++) where.set(inorder[i], i);
  let next = 0;
  // Builds the subtree whose joints sit in inorder from lo up to but not including hi
  const build = (lo: number, hi: number): TreeNode | null => {
    if (lo >= hi) return null;
    const value = preorder[next++];
    const at = where.get(value) as number;
    const node = new TreeNode(value);
    // Preorder lists the whole left branch before the right, so build the left first
    node.left = build(lo, at);
    node.right = build(at + 1, hi);
    return node;
  };
  return build(0, inorder.length);
}
