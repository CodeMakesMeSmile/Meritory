const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function fewestDrifts(field: number[][]): number {
  const rows = field.length;
  const cols = field[0].length;
  const cells = rows * cols;
  // Cell (r, c) is number r * cols + c, and entering it costs its own value
  const drifts = new Array<number>(cells).fill(Infinity);
  const done = new Array<boolean>(cells).fill(false);
  drifts[0] = field[0][0];
  // A deque as a ring buffer: each cell adds at most 4 entries, so this many slots never fill
  const size = 4 * cells + 1;
  const deque = new Array<number>(size);
  let head = 0;
  let count = 1;
  deque[0] = 0;
  while (count > 0) {
    const at = deque[head];
    head = (head + 1) % size;
    count--;
    // A cell can be added more than once, and only its first time out counts
    if (done[at]) continue;
    done[at] = true;
    const row = Math.floor(at / cols);
    const col = at % cols;
    for (const [dr, dc] of STEPS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const next = nr * cols + nc;
      const cost = field[nr][nc];
      if (drifts[at] + cost < drifts[next]) {
        drifts[next] = drifts[at] + cost;
        if (cost === 0) {
          // A clear cell costs no more, so it goes to the front
          head = (head - 1 + size) % size;
          deque[head] = next;
        } else {
          // A drift costs one more, so it waits at the back
          deque[(head + count) % size] = next;
        }
        count++;
      }
    }
  }
  return drifts[cells - 1];
}
