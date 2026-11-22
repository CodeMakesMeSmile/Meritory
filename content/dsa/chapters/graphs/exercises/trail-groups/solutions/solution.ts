export function trailGroups(n: number, trails: number[][]): number {
  // Each trail goes both ways, so it's listed under both of its campsites
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of trails) {
    neighbours[a].push(b);
    neighbours[b].push(a);
  }
  const seen = new Array<boolean>(n).fill(false);
  let groups = 0;
  for (let site = 0; site < n; site++) {
    if (seen[site]) continue;
    // An unseen campsite starts a new group, and the walk marks all of it
    groups++;
    seen[site] = true;
    // Our own stack instead of recursion, since one chain can hold every campsite
    const stack = [site];
    while (stack.length > 0) {
      const at = stack.pop() as number;
      for (const next of neighbours[at]) {
        if (!seen[next]) {
          seen[next] = true;
          stack.push(next);
        }
      }
    }
  }
  return groups;
}
