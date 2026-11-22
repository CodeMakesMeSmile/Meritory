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

export function alertTime(n: number, links: number[][], start: number): number {
  // Links only go one way, so each is listed under the relay that sends it
  const out: number[][][] = Array.from({ length: n }, () => []);
  for (const [from, to, delay] of links) out[from].push([to, delay]);
  const time = new Array<number>(n).fill(Infinity);
  time[start] = 0;
  // Each entry is [time, relay], with the earliest on top
  const heap = new Heap<number[]>((a, b) => a[0] < b[0]);
  heap.push([0, start]);
  while (heap.size() > 0) {
    const [at, relay] = heap.pop() as number[];
    // A stale entry, since this relay was already settled at an earlier time
    if (at > time[relay]) continue;
    for (const [next, delay] of out[relay]) {
      if (at + delay < time[next]) {
        time[next] = at + delay;
        heap.push([time[next], next]);
      }
    }
  }
  // Every relay hears at its own earliest time, so the last one to hear sets the answer
  let last = 0;
  for (const t of time) {
    if (t === Infinity) return -1;
    last = Math.max(last, t);
  }
  return last;
}
