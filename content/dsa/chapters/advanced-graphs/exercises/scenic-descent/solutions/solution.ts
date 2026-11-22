export function mostScenic(
  n: number,
  runs: number[][],
  start: number,
  goal: number,
): number {
  const out: number[][][] = Array.from({ length: n }, () => []);
  const waiting = new Array<number>(n).fill(0);
  for (const [from, to, views] of runs) {
    out[from].push([to, views]);
    waiting[to]++;
  }
  // best[hut] is the most views on any way down from start so far, and -1 means not reached
  const best = new Array<number>(n).fill(-1);
  best[start] = 0;
  // Kahn's algorithm gives an order where every run points later in the order
  const order: number[] = [];
  for (let hut = 0; hut < n; hut++) {
    if (waiting[hut] === 0) order.push(hut);
  }
  for (let head = 0; head < order.length; head++) {
    const hut = order[head];
    // Every run into this hut came from earlier in the order, so its best is final
    for (const [next, views] of out[hut]) {
      // Only huts reached from the start can pass on a score
      if (best[hut] !== -1) {
        best[next] = Math.max(best[next], best[hut] + views);
      }
      waiting[next]--;
      if (waiting[next] === 0) order.push(next);
    }
  }
  return best[goal];
}
