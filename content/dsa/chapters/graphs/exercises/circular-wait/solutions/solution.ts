export function hasCircularWait(n: number, waits: number[][]): boolean {
  // A wait [a, b] means b must finish first, so b unlocks a
  const unlocks: number[][] = Array.from({ length: n }, () => []);
  const waiting = new Array<number>(n).fill(0);
  for (const [a, b] of waits) {
    unlocks[b].push(a);
    waiting[a]++;
  }
  const ready: number[] = [];
  for (let step = 0; step < n; step++) {
    if (waiting[step] === 0) ready.push(step);
  }
  // Kahn's algorithm: finish a ready step, then free whatever was only waiting on it
  for (let head = 0; head < ready.length; head++) {
    for (const next of unlocks[ready[head]]) {
      waiting[next]--;
      if (waiting[next] === 0) ready.push(next);
    }
  }
  // A step in a circle, or behind one, never becomes ready
  return ready.length < n;
}
