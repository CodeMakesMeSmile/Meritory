export function packTree(story: TreeNode | null): string {
  const parts: string[] = [];
  const write = (node: TreeNode | null): void => {
    // A marker for each missing child shows where a branch ends
    if (!node) {
      parts.push("#");
      return;
    }
    parts.push(String(node.val));
    write(node.left);
    write(node.right);
  };
  write(story);
  return parts.join(",");
}
