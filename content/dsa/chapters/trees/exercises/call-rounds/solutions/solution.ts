export function callRounds(tree: TreeNode | null): number[][] {
  const rounds: number[][] = [];
  const queue: TreeNode[] = tree ? [tree] : [];
  let head = 0;
  while (head < queue.length) {
    // The queue holds exactly one round right now
    const size = queue.length - head;
    const round: number[] = [];
    for (let i = 0; i < size; i++) {
      const node = queue[head++];
      round.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    rounds.push(round);
  }
  return rounds;
}
