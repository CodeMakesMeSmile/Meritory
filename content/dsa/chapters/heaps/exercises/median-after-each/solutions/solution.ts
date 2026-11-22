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

export function runningMedians(times: number[]): number[] {
  // low holds the shorter half with its longest on top, and high holds the longer half
  const low = new Heap<number>((a, b) => a > b);
  const high = new Heap<number>((a, b) => a < b);
  const medians: number[] = [];
  for (const time of times) {
    // Passing each time through low keeps every value in low at most every value in high
    low.push(time);
    high.push(low.pop() as number);
    // Keep low the same size as high, or one bigger
    if (high.size() > low.size()) low.push(high.pop() as number);
    const middle = low.peek() as number;
    medians.push(
      low.size() > high.size()
        ? middle
        : (middle + (high.peek() as number)) / 2,
    );
  }
  return medians;
}
