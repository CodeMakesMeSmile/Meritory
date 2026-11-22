export function seenFromEast(lanterns: TreeNode | null): number[] {
  const seen: number[] = [];
  const queue: TreeNode[] = lanterns ? [lanterns] : [];
  let head = 0;
  while (head < queue.length) {
    // The queue holds exactly one level right now
    const size = queue.length - head;
    for (let i = 0; i < size; i++) {
      const node = queue[head++];
      // The last lantern taken from a level is the one furthest east
      if (i === size - 1) seen.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return seen;
}
