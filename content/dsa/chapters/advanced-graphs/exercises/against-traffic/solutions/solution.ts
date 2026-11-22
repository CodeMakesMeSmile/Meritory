export function fewestAgainst(
  n: number,
  streets: number[][],
  start: number,
  goal: number,
): number {
  // Riding the right way costs 0, and walking the wrong way costs 1
  const out: number[][][] = Array.from({ length: n }, () => []);
  for (const [a, b] of streets) {
    out[a].push([b, 0]);
    out[b].push([a, 1]);
  }
  const walked = new Array<number>(n).fill(Infinity);
  const done = new Array<boolean>(n).fill(false);
  walked[start] = 0;
  // A deque as a ring buffer: each junction adds at most one entry per street end, so this many slots never fill
  const size = 2 * streets.length + 1;
  const deque = new Array<number>(size);
  let head = 0;
  let count = 1;
  deque[0] = start;
  while (count > 0) {
    const at = deque[head];
    head = (head + 1) % size;
    count--;
    // A junction can be added more than once, and only its first time out counts
    if (done[at]) continue;
    done[at] = true;
    for (const [next, cost] of out[at]) {
      if (walked[at] + cost < walked[next]) {
        walked[next] = walked[at] + cost;
        if (cost === 0) {
          // Riding costs nothing more, so it goes to the front
          head = (head - 1 + size) % size;
          deque[head] = next;
        } else {
          // Walking costs one more, so it waits at the back
          deque[(head + count) % size] = next;
        }
        count++;
      }
    }
  }
  return walked[goal] === Infinity ? -1 : walked[goal];
}
