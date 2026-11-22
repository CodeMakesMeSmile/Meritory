export function earliestFinish(hours: number[], needs: number[][]): number {
  const n = hours.length;
  const unlocks: number[][] = Array.from({ length: n }, () => []);
  const waiting = new Array<number>(n).fill(0);
  for (const [before, after] of needs) {
    unlocks[before].push(after);
    waiting[after]++;
  }
  // begin[i] is the latest finish of everything task i waits on so far
  const begin = new Array<number>(n).fill(0);
  // Kahn's algorithm: a task joins the order once everything it waits on is in it
  const order: number[] = [];
  for (let task = 0; task < n; task++) {
    if (waiting[task] === 0) order.push(task);
  }
  let last = 0;
  for (let head = 0; head < order.length; head++) {
    const task = order[head];
    // Everything this task waits on came earlier in the order, so its start is final
    const finish = begin[task] + hours[task];
    last = Math.max(last, finish);
    for (const next of unlocks[task]) {
      begin[next] = Math.max(begin[next], finish);
      waiting[next]--;
      if (waiting[next] === 0) order.push(next);
    }
  }
  return last;
}
