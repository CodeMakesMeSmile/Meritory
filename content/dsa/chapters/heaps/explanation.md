# Heaps

A heap answers one question quickly: what's the smallest thing I have right now? It can add a value or take out the smallest in O(log n), and look at the smallest without taking it in O(1). It doesn't keep everything sorted, only enough order to know what's on top. That's why it beats sorting when values keep arriving, or when you only need a few of them.

Everything here works the same way for the largest value. A heap with the smallest on top is a **min-heap**, and one with the largest on top is a **max-heap**.

## How a binary heap is laid out

A binary heap is a binary tree with two rules.

- **Shape.** Every level is full except maybe the last, and the last fills from the left.
- **Order.** In a min-heap, every parent is at most each of its children. So the smallest value is always at the root.

Siblings have no order between them, and neither do cousins. The heap only promises that each path from the root down never goes down in value.

Because the shape has no gaps, the tree fits in an array with no pointers at all. The root is at index 0, the children of index `i` are at `2i + 1` and `2i + 2`, and its parent is at `(i - 1) / 2`, rounded down.

```text
[1, 3, 2, 7, 4, 5]

        1
       / \
      3   2
     / \  /
    7  4 5
```

The children of 3, at index 1, sit at indexes 3 and 4, which hold 7 and 4. The child of 2, at index 2, sits at index 5. Notice the array isn't sorted: 3 comes before 2, and that's fine, because neither is the other's parent.

## Sift up and sift down

**Adding a value.** Put it at the end of the array. That's the next free spot in the last level, so the shape stays right. Then **sift up**: while the new value is smaller than its parent, swap them.

**Taking the smallest.** The answer is at index 0. Move the last value in the array to the root, which keeps the shape, then **sift down**: while either child is smaller, swap with the smaller of the two children. Swapping with the smaller child matters, because then the new parent is at most both children.

Each swap moves one level, and a heap of n values has about log₂ n levels, so both are O(log n). Looking at the top is O(1).

**Building a heap from n values.** Adding them one at a time costs O(n log n). Sifting down every parent, from the last parent back to the root, builds the same heap in O(n), because most values sit near the bottom and only move a little. That's what Python's `heapq.heapify` does.

## Heaps in each language

| Language | What it gives you | Order |
|---|---|---|
| Python | The `heapq` functions, which work on a plain list | Smallest first. From Python 3.14, `heapify_max`, `heappush_max`, `heappop_max`, `heapreplace_max`, and `heappushpop_max` give a max-heap. On older versions, push negated values |
| Java | `PriorityQueue` | Smallest first. Pass `Collections.reverseOrder()` or a comparator for anything else |
| TypeScript | Nothing built in | Write a small class, like the one below |
| C | Nothing built in | Write one over an array |

In Python, `heap[0]` is the smallest, `heapq.heappush` and `heapq.heappop` add and take, and `heapq.heapreplace` pops and pushes in one step. Tuples compare one item at a time, so `(priority, index, item)` orders by priority and breaks ties by index. Put something that compares cleanly second, because two equal priorities make Python compare whatever comes next.

In Java, write comparators with `Integer.compare(a[1], b[1])` rather than `a[1] - b[1]`. The subtraction can overflow and quietly give the wrong order.

TypeScript needs its own heap. This one takes a function `before(a, b)` that's true when `a` should come out first, so `new Heap<number>((a, b) => a < b)` is a min-heap and `(a, b) => a > b` makes a max-heap.

```ts
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
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let first = i;
        if (left < items.length && this.before(items[left], items[first])) first = left;
        if (right < items.length && this.before(items[right], items[first])) first = right;
        if (first === i) break;
        [items[i], items[first]] = [items[first], items[i]];
        i = first;
      }
    }
    return top;
  }
}
```

In an interview, it's usually fine to say you'd use a heap class and describe what it does. Be ready to write it when asked, though, since sift up and sift down are a common follow-up.

## The top k with a heap of size k

To keep the k largest of n values, use a **min-heap** of at most k values. It sounds backward, but the smallest of the keepers is exactly the one to throw out when something bigger arrives, and a min-heap keeps it on top.

```ts
const best = new Heap<number>((a, b) => a < b);
for (const value of values) {
  best.push(value);
  if (best.size() > k) best.pop();
}
```

The heap never holds more than k + 1 values, so each step is O(log k), and the whole pass is O(n log k) time with O(k) memory. When the loop ends, the top is the k-th largest. That also works while values are still arriving: after each one, the k-th largest so far is on top.

The same shape finds the k nearest points or the k most common words. Only the ordering changes. For the k nearest, keep a max-heap by distance, so the farthest keeper is the one pushed out. Compare squared distances, `x * x + y * y`, which order points the same way with no square root. When values can tie, the question has to say how ties break, like alphabetical order, and the ordering function has to follow it.

## Merging k sorted lists

To merge k sorted lists, keep a heap that holds the front value of each list, along with which list it came from and where. Take the smallest out and add it to the answer, then push the next value from that same list.

```ts
const fronts = new Heap<number[]>((a, b) => a[0] < b[0]);
lists.forEach((list, which) => {
  if (list.length > 0) fronts.push([list[0], which, 0]);
});
while (fronts.size() > 0) {
  const [value, which, at] = fronts.pop() as number[];
  merged.push(value);
  if (at + 1 < lists[which].length) fronts.push([lists[which][at + 1], which, at + 1]);
}
```

The heap never holds more than k entries, so N values in all take O(N log k). Skip empty lists at the start. To find only the k-th smallest value across all the lists, stop after k values come out, which can be far less work than merging everything.

## Two heaps for a running median

The median is the middle value once the values are sorted, or the mean of the two middle values when there's an even number of them. Sorting again after every new value is O(n log n) each time. Two heaps make it O(log n).

Split the values into two halves. The lower half goes in a **max-heap**, so its largest value is on top. The upper half goes in a **min-heap**, so its smallest is on top. Keep the halves the same size, or let the lower one hold one extra. Then the median is the lower half's top when the count is odd, and the mean of both tops when it's even.

```ts
add(value: number): void {
  this.low.push(value);
  this.high.push(this.low.pop() as number);
  if (this.high.size() > this.low.size()) this.low.push(this.high.pop() as number);
}
```

Passing every new value through the lower half first keeps every value in `low` at most every value in `high`, which is the whole point. Then one move fixes the sizes. Each add is O(log n), and reading the median is O(1).

The mean of two whole numbers can end in .5, so the median is a decimal. In Java and C, turn the values into doubles before adding them, since two large ints can overflow.

## Scheduling with a heap

**The fewest rooms.** Given meetings with a start and an end, how many rooms are needed so none overlap in the same room? Sort the meetings by start. Keep a min-heap of the end time of each room in use, so the room that frees up first is on top. For each meeting, if that room is free by the time this one starts, reuse it by popping its old end time. Either way, push this meeting's end. Reusing a room keeps the heap the same size, and a new room adds one, so its size at the end is the answer.

Check whether a meeting ending at 10 frees its room for one starting at 10. Most questions say yes, which means comparing with `<=`.

**The most jobs on time.** With one machine and jobs that each have a length and a deadline, which jobs should you take to finish the most on time? Sort by deadline and keep a running finish time. Take each job in turn, pushing its length onto a **max-heap**. If the finish time is now past this job's deadline, drop the longest job taken so far. Dropping one job is unavoidable, and dropping the longest frees the most time for the jobs still to come. That's O(n log n) for sorting plus one heap step per job.

## When sorting beats a heap

A heap isn't always the right tool. Ask what you actually need.

| You need | Reach for | Why |
|---|---|---|
| Every value in order, and they're all known up front | Sort once | Same O(n log n), less code, and faster in practice |
| Only the k best, in order | A heap of size k | O(n log k), which beats sorting when k is much smaller than n |
| Only the k best, in any order | A heap, or quickselect | Quickselect averages O(n), as in the two pointers chapter |
| The smallest or largest as values keep arriving, or as the set changes | A heap | A sorted array costs O(n) for every insert |
| Just the smallest value, once | One pass | O(n), no heap needed |

Sometimes a sort is the whole answer. The fewest rooms can also be found by sorting the starts and the ends as two separate lists, then walking both: a start before the next end needs one more room, and an end frees one. That's the same O(n log n) with no heap at all, and either answer is fine in an interview.

A heap also can't find a value quickly. Searching for one, or removing one from the middle, is O(n). When you need that, mark the value as removed and skip it when it reaches the top, or use a balanced search tree.

Before you start, ask about the edges: an empty input, a k of 1 or a k as big as the input, values that tie, values that repeat, and whether the answer has to be in order.
