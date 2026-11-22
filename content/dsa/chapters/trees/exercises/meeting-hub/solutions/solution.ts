export function meetingHub(
  hubs: TreeNode | null,
  a: number,
  b: number,
): number {
  let node = hubs;
  while (node) {
    // Both routes go the same way from here, so the split is further down
    if (a < node.val && b < node.val) node = node.left;
    else if (a > node.val && b > node.val) node = node.right;
    else return node.val;
  }
  return -1;
}
