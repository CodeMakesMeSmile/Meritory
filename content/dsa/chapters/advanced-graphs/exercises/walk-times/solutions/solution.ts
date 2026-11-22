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

export function walkTimes(
  n: number,
  paths: number[][],
  start: number,
): number[] {
  // Footpaths go both ways, so each is listed under both stalls
  const out: number[][][] = Array.from({ length: n }, () => []);
  for (const [a, b, minutes] of paths) {
    out[a].push([b, minutes]);
    out[b].push([a, minutes]);
  }
  const time = new Array<number>(n).fill(Infinity);
  time[start] = 0;
  // Each entry is [minutes, stall], with the quickest on top
  const heap = new Heap<number[]>((a, b) => a[0] < b[0]);
  heap.push([0, start]);
  while (heap.size() > 0) {
    const [at, stall] = heap.pop() as number[];
    // A stale entry, since this stall was already settled by a quicker walk
    if (at > time[stall]) continue;
    for (const [next, minutes] of out[stall]) {
      if (at + minutes < time[next]) {
        time[next] = at + minutes;
        heap.push([time[next], next]);
      }
    }
  }
  return time.map((t) => (t === Infinity ? -1 : t));
}
