// A binary heap where before(a, b) is true when a should come out first
class Heap<T> {
  private items: T[] = [];
  private before: (a: T, b: T) => boolean;

  constructor(before: (a: T, b: T) => boolean) {
    this.before = before;
  }

  size(): number {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  push(item: T): void {
    const items = this.items;
    items.push(item);
    // Sift up while the new item should come out before its parent
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.before(items[i], items[parent])) break;
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }

  pop(): T | undefined {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0 && last !== undefined) {
      // Move the last item to the root, then sift it down
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let first = i;
        if (left < items.length && this.before(items[left], items[first])) {
          first = left;
        }
        if (right < items.length && this.before(items[right], items[first])) {
          first = right;
        }
        if (first === i) break;
        [items[i], items[first]] = [items[first], items[i]];
        i = first;
      }
    }
    return top;
  }
}

const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function gentlestClimb(heights: number[][]): number {
  const rows = heights.length;
  const cols = heights[0].length;
  const cells = rows * cols;
  // Cell (r, c) is number r * cols + c, and strain holds the gentlest route to it so far
  const strain = new Array<number>(cells).fill(Infinity);
  strain[0] = 0;
  // Each entry is [strain, cell], with the gentlest on top
  const heap = new Heap<number[]>((a, b) => a[0] < b[0]);
  heap.push([0, 0]);
  while (heap.size() > 0) {
    const [at, cell] = heap.pop() as number[];
    // A stale entry, since this cell was already settled by a gentler route
    if (at > strain[cell]) continue;
    // The first time the far corner comes out, its strain is final
    if (cell === cells - 1) return at;
    const row = Math.floor(cell / cols);
    const col = cell % cols;
    for (const [dr, dc] of STEPS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      // A route's strain is its hardest step, so take the larger instead of adding
      const step = Math.abs(heights[nr][nc] - heights[row][col]);
      const through = Math.max(at, step);
      const next = nr * cols + nc;
      if (through < strain[next]) {
        strain[next] = through;
        heap.push([through, next]);
      }
    }
  }
  return strain[cells - 1];
}
