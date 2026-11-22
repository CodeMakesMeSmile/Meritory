export function coinRoute(rooms: TreeNode | null, target: number): boolean {
  // Each call carries the gold gathered on the way down to this room
  const search = (node: TreeNode | null, sum: number): boolean => {
    if (!node) return false;
    const total = sum + node.val;
    if (!node.left && !node.right) return total === target;
    return search(node.left, total) || search(node.right, total);
  };
  return search(rooms, 0);
}
