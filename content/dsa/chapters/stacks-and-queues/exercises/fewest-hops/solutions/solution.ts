export function fewestHops(stones: number[]): number {
  const last = stones.length - 1;
  // hops[i] stays -1 until stone i is first reached, which is by the fewest hops
  const hops = new Array<number>(stones.length).fill(-1);
  hops[0] = 0;
  const queue = [0];
  // A head index stands in for removing from the front, which is O(n) on an array
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    if (at === last) return hops[at];
    for (const next of [at + stones[at], at - stones[at]]) {
      if (next >= 0 && next <= last && hops[next] === -1) {
        hops[next] = hops[at] + 1;
        queue.push(next);
      }
    }
  }
  return -1;
}
