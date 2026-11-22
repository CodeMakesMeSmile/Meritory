export function spareCable(n: number, cables: number[][]): number[] {
  // Each building points to its parent, and a group's root points to itself
  const parent = Array.from({ length: n }, (_, i) => i);
  // A root's rank is an upper bound on its tree's height
  const rank = new Array<number>(n).fill(0);
  const find = (building: number): number => {
    let root = building;
    while (parent[root] !== root) root = parent[root];
    // Path compression: point every building on the way straight at the root
    let at = building;
    while (parent[at] !== root) {
      const next = parent[at];
      parent[at] = root;
      at = next;
    }
    return root;
  };
  for (const [a, b] of cables) {
    const rootA = find(a);
    const rootB = find(b);
    // Already in the same group, so this cable only closes a loop
    if (rootA === rootB) return [a, b];
    // Union by rank: hang the shorter tree under the taller one
    if (rank[rootA] < rank[rootB]) {
      parent[rootA] = rootB;
    } else if (rank[rootA] > rank[rootB]) {
      parent[rootB] = rootA;
    } else {
      parent[rootB] = rootA;
      rank[rootA]++;
    }
  }
  return [];
}
