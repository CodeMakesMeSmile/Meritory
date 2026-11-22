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

export function topSearches(searches: string[], k: number): string[] {
  const counts = new Map<string, number>();
  for (const word of searches) counts.set(word, (counts.get(word) ?? 0) + 1);
  // The weakest of the k best words sits on top: fewest searches, then last in the alphabet
  const weaker = (a: [string, number], b: [string, number]) =>
    a[1] < b[1] || (a[1] === b[1] && a[0] > b[0]);
  const best = new Heap<[string, number]>(weaker);
  for (const entry of counts) {
    best.push(entry);
    if (best.size() > k) best.pop();
  }
  // The heap gives them up weakest first, so fill the answer from the back
  const top = new Array<string>(best.size());
  for (let i = top.length - 1; i >= 0; i--) {
    top[i] = (best.pop() as [string, number])[0];
  }
  return top;
}
