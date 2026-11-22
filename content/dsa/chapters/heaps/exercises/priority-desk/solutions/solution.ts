export class RepairDesk {
  // A min-heap in an array, where the children of index i sit at 2i + 1 and 2i + 2
  private items: number[] = [];

  add(urgency: number): void {
    const items = this.items;
    items.push(urgency);
    // Sift up: swap with the parent while the parent is less urgent
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent] <= items[i]) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  next(): number {
    const items = this.items;
    const top = items[0];
    const last = items.pop() as number;
    if (items.length > 0) {
      // Move the last job to the root, then sift it down
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && items[left] < items[smallest]) {
          smallest = left;
        }
        if (right < items.length && items[right] < items[smallest]) {
          smallest = right;
        }
        if (smallest === i) break;
        [items[smallest], items[i]] = [items[i], items[smallest]];
        i = smallest;
      }
    }
    return top;
  }

  peek(): number {
    return this.items[0];
  }

  size(): number {
    return this.items.length;
  }
}
