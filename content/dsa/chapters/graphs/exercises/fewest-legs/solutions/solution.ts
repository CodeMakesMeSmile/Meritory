export function fewestRides(
  n: number,
  routes: number[][],
  start: number,
  goal: number,
): number {
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of routes) {
    neighbours[a].push(b);
    neighbours[b].push(a);
  }
  // rides[i] stays -1 until island i is first reached, which is by the fewest rides
  const rides = new Array<number>(n).fill(-1);
  rides[start] = 0;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    if (at === goal) return rides[at];
    for (const next of neighbours[at]) {
      // Marking an island as it joins the queue keeps it from joining twice
      if (rides[next] === -1) {
        rides[next] = rides[at] + 1;
        queue.push(next);
      }
    }
  }
  return -1;
}
