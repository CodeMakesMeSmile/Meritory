export function leastPipe(n: number, pipes: number[][]): number {
  // Cheapest pipes first, without changing the caller's list
  const sorted = [...pipes].sort((a, b) => a[2] - b[2]);
  // Each greenhouse points to its parent, and a group's root points to itself
  const parent = Array.from({ length: n }, (_, i) => i);
  // A root's rank is an upper bound on its tree's height
  const rank = new Array<number>(n).fill(0);
  const find = (greenhouse: number): number => {
    let root = greenhouse;
    while (parent[root] !== root) root = parent[root];
    // Path compression: point every greenhouse on the way straight at the root
    let at = greenhouse;
    while (parent[at] !== root) {
      const next = parent[at];
      parent[at] = root;
      at = next;
    }
    return root;
  };
  let total = 0;
  let laid = 0;
  for (const [a, b, cost] of sorted) {
    // A tree over n greenhouses needs exactly n - 1 pipes
    if (laid === n - 1) break;
    const rootA = find(a);
    const rootB = find(b);
    // Already joined, so this pipe would only close a loop
    if (rootA === rootB) continue;
    // Union by rank: hang the shorter tree under the taller one
    if (rank[rootA] < rank[rootB]) {
      parent[rootA] = rootB;
    } else if (rank[rootA] > rank[rootB]) {
      parent[rootB] = rootA;
    } else {
      parent[rootB] = rootA;
      rank[rootA]++;
    }
    total += cost;
    laid++;
  }
  // Running out of pipes before n - 1 means some greenhouse can't be reached
  return laid === n - 1 ? total : -1;
}
