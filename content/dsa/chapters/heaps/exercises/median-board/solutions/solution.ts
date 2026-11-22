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

export class MedianBoard {
  // low holds the smaller half with its largest on top, and high holds the larger half
  private low = new Heap<number>((a, b) => a > b);
  private high = new Heap<number>((a, b) => a < b);

  record(reading: number): void {
    // Passing each reading through low keeps every value in low at most every value in high
    this.low.push(reading);
    this.high.push(this.low.pop() as number);
    // Keep low the same size as high, or one bigger
    if (this.high.size() > this.low.size()) {
      this.low.push(this.high.pop() as number);
    }
  }

  median(): number {
    const middle = this.low.peek() as number;
    if (this.low.size() > this.high.size()) return middle;
    return (middle + (this.high.peek() as number)) / 2;
  }
}
