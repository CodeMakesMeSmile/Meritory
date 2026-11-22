const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function islandsAfterEach(
  rows: number,
  cols: number,
  raised: number[][],
): number[] {
  // Cell (r, c) is number r * cols + c, and a parent of -1 means it's still sea
  const parent = new Array<number>(rows * cols).fill(-1);
  // A root's rank is an upper bound on its tree's height
  const rank = new Array<number>(rows * cols).fill(0);
  const find = (cell: number): number => {
    let root = cell;
    while (parent[root] !== root) root = parent[root];
    // Path compression: point every cell on the way straight at the root
    let at = cell;
    while (parent[at] !== root) {
      const next = parent[at];
      parent[at] = root;
      at = next;
    }
    return root;
  };
  // Joins two groups, and says whether they were apart before
  const union = (a: number, b: number): boolean => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return false;
    // Union by rank: hang the shorter tree under the taller one
    if (rank[rootA] < rank[rootB]) {
      parent[rootA] = rootB;
    } else if (rank[rootA] > rank[rootB]) {
      parent[rootB] = rootA;
    } else {
      parent[rootB] = rootA;
      rank[rootA]++;
    }
    return true;
  };
  const counts: number[] = [];
  let islands = 0;
  for (const [r, c] of raised) {
    const cell = r * cols + c;
    // Land that rises again changes nothing
    if (parent[cell] === -1) {
      parent[cell] = cell;
      islands++;
      // Each join with a neighbouring island merges two into one
      for (const [dr, dc] of STEPS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const next = nr * cols + nc;
        if (parent[next] !== -1 && union(cell, next)) islands--;
      }
    }
    counts.push(islands);
  }
  return counts;
}
