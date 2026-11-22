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

export function mergeWaves(waves: number[][]): number[] {
  // Each entry is [time, wave, position], and the heap holds one front per wave
  const fronts = new Heap<number[]>((a, b) => a[0] < b[0]);
  waves.forEach((wave, w) => {
    if (wave.length > 0) fronts.push([wave[0], w, 0]);
  });
  const merged: number[] = [];
  while (fronts.size() > 0) {
    const [time, w, at] = fronts.pop() as number[];
    merged.push(time);
    // The next time in the same wave takes its place
    if (at + 1 < waves[w].length) fronts.push([waves[w][at + 1], w, at + 1]);
  }
  return merged;
}
