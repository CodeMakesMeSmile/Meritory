# Stacks and queues

A stack and a queue are both lists that only let you add and remove at the ends. A stack hands back the item added most recently, like a pile of plates. A queue hands back the item that has waited longest, like a line at a counter. That sounds like less than a plain list can do, and it is. The limit is the point: when a problem only ever needs the newest item or the oldest one, a stack or a queue answers in O(1) and makes the order of the work clear.

## What each one costs

A stack adds and removes at the same end, often called the top. Pushing onto the top and popping it off are both O(1).

| Language | Stack | Queue |
|---|---|---|
| TypeScript | An array with `push` and `pop` | An array with a `head` index, since `shift` can be O(n) |
| Python | A list with `append` and `pop` | `collections.deque` with `append` and `popleft` |
| Java | `ArrayDeque` with `push` and `pop` | `ArrayDeque` with `offer` and `poll` |

Removing from the front of a plain array or list moves every other item down one place, so it's O(n). That's why a queue in TypeScript keeps a `head` index that moves forward instead of calling `shift`. Java's old `Stack` class still works, but `ArrayDeque` is faster and is the one to reach for.

## Matching pairs

Brackets, tags, and anything else that opens and closes must close in the reverse order they opened. The most recent thing opened is the first one that has to close. That's exactly what a stack hands back.

```ts
const closes: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const open: string[] = [];
for (const char of text) {
  if (char === "(" || char === "[" || char === "{") open.push(char);
  else if (char in closes) {
    if (open.pop() !== closes[char]) return false;
  }
}
return open.length === 0;
```

There are three ways to fail, and a good answer checks all of them:

- A closing mark doesn't match the one on top of the stack, as in `(]`.
- A closing mark arrives when nothing is open, as in `)(`. Popping an empty array in TypeScript gives `undefined`, which never matches, but in Python and Java an empty pop throws, so check first.
- Marks are still open when the text ends, as in `((`. Check that the stack is empty at the end.

Counting opens and closes isn't enough once there's more than one kind of bracket. `([)]` has one of each kind open and closed, but the square bracket closes while the round one is still open inside it.

## The next greater or smaller value

For each day's temperature, how many days until a warmer one? Checking every later day is O(n²). A monotonic stack does it in one pass.

Keep a stack of the positions still waiting for an answer. Their values never go up from bottom to top, because a bigger value would already have answered the ones below it. When a new value arrives, it answers every waiting position whose value is smaller, so pop those and record the answer for each. Then push the new position to wait.

```ts
const wait = new Array<number>(temps.length).fill(0);
const waiting: number[] = [];
for (let day = 0; day < temps.length; day++) {
  while (waiting.length > 0 && temps[waiting[waiting.length - 1]] < temps[day]) {
    const earlier = waiting.pop() as number;
    wait[earlier] = day - earlier;
  }
  waiting.push(day);
}
```

Each position is pushed once and popped at most once, so the whole pass is O(n), even with the loop inside a loop. Positions left on the stack at the end never found a bigger value, so they keep the default, like 0 or -1.

Store positions, not values. The position tells you how far apart the two days are, and you can always read the value back from it.

The same stack answers four questions by changing two things:

- For the next **smaller** value, pop while the top's value is **bigger** than the new one.
- For the **previous** greater or smaller value, walk from the right instead, or read the answer from whatever is left on top after popping.

Whether to pop on equal values depends on the question. "The next day with more visitors" needs strictly more, so a day with the same count doesn't answer it, and you pop only on `<`.

## How far each value reaches

Sometimes the question isn't which value comes next, but how far a value stretches before something stops it. A day's price span is how many days in a row, ending today, had a price no higher than today's. Pop every earlier day whose price is no higher than today's. Whatever is left on top is the last day with a higher price, and the span is the distance back to it, or every day so far if the stack is empty.

The biggest rectangle that fits under a row of bars works the same way. A rectangle as tall as one bar can stretch left and right until it meets a shorter bar on each side. Keep a stack whose bar heights rise from bottom to top. When a shorter bar arrives, it's the right edge for every taller bar on the stack. Pop each one, and the bar now under it is that bar's left edge.

```ts
let best = 0;
const rising: number[] = [];
for (let i = 0; i <= heights.length; i++) {
  // A height of 0 past the end pops every bar still waiting
  const height = i < heights.length ? heights[i] : 0;
  while (rising.length > 0 && heights[rising[rising.length - 1]] >= height) {
    const top = rising.pop() as number;
    const left = rising.length > 0 ? rising[rising.length - 1] : -1;
    best = Math.max(best, heights[top] * (i - left - 1));
  }
  rising.push(i);
}
```

The width is `i - left - 1`, the bars strictly between the two shorter ones. The extra step past the end, with a height of 0, empties the stack so no bar is forgotten. Each bar is pushed and popped once, so this is O(n) where trying every pair of edges is O(n²).

## Postfix expressions

In postfix notation, also called reverse Polish notation, each operator comes after the two values it works on. `3 4 +` means 3 + 4, and `5 1 2 + 4 * + 3 -` means 5 + (1 + 2) × 4 - 3, which is 14. There are no brackets and no order of operations to remember, which is why calculators and compilers like it.

Read the tokens from left to right. Push each number. For an operator, pop two values, apply it, and push the result. When the tokens run out, the one value left is the answer.

```ts
const values: number[] = [];
for (const token of tokens) {
  if (token === "+" || token === "-" || token === "*" || token === "/") {
    const right = values.pop() as number;
    const left = values.pop() as number;
    if (token === "+") values.push(left + right);
    else if (token === "-") values.push(left - right);
    else if (token === "*") values.push(left * right);
    else values.push(Math.trunc(left / right));
  } else {
    values.push(Number(token));
  }
}
return values[0];
```

The first value popped is the **right** side. For `8 2 -`, the top is 2, so the answer is 8 - 2, not 2 - 8. Getting this backwards still passes for `+` and `*`, so test with `-` and `/`.

Division is the other trap. Most problems want it to cut toward zero, so -7 / 2 is -3. TypeScript's `Math.trunc` and Java's and C's `/` on whole numbers do that. Python's `//` rounds down instead, giving -4, so work out the sign separately or use `int(left / right)` for small values.

A token like `-3` is a negative number, not an operator, so check for the four operators exactly rather than looking at the first character.

## A stack that knows its minimum

A stack can tell you its top in O(1), but its smallest value would take a scan. The fix is to store, beside each entry, the smallest value from the bottom up to that entry. The minimum of the whole stack is then the one stored at the top.

```ts
class MinStack {
  private entries: { value: number; min: number }[] = [];

  push(value: number): void {
    const below = this.entries[this.entries.length - 1];
    const min = below ? Math.min(below.min, value) : value;
    this.entries.push({ value, min });
  }

  pop(): number {
    return (this.entries.pop() as { value: number; min: number }).value;
  }

  min(): number {
    return this.entries[this.entries.length - 1].min;
  }
}
```

A single variable for the minimum doesn't work. When the smallest value is popped, you'd need the next smallest, and finding it means a scan. Storing a minimum with each entry remembers what the minimum was before every push, so popping puts it back for free. It costs one extra number per entry.

## A queue from two stacks

You can build a queue out of two stacks. New items go onto an inbox stack. To take from the front, read from an outbox stack. When the outbox is empty, pop every item from the inbox and push it onto the outbox, which turns the order around so the oldest item ends up on top.

```ts
class TwoStackQueue {
  private inbox: number[] = [];
  private outbox: number[] = [];

  add(item: number): void {
    this.inbox.push(item);
  }

  remove(): number {
    if (this.outbox.length === 0) {
      while (this.inbox.length > 0) this.outbox.push(this.inbox.pop() as number);
    }
    return this.outbox.pop() as number;
  }
}
```

Only move items when the outbox is empty. Moving them while it still holds items would put newer items on top of older ones and break the order.

One `remove` can move every item, so it's O(n) on its own. But each item is moved from the inbox to the outbox once in its life, so over any run of calls the total work is O(1) per call. That's called amortized O(1): some calls are slow, but they're paid for by all the fast ones before them.

## Queues and breadth-first order

A queue handles work in the order it arrived. That's the right order whenever fairness matters, like a printer that gives each job a turn, and whenever you want the nearest things first.

To find the fewest moves from a start to a goal, where every move costs the same, use a breadth-first search. Put the start in a queue with a distance of 0. Take the front, and add each place one move away that hasn't been seen, with a distance one more. Everything at distance 1 leaves the queue before anything at distance 2, so the first time you reach the goal is by the fewest moves.

```ts
const distance = new Array<number>(n).fill(-1);
distance[start] = 0;
const queue = [start];
for (let head = 0; head < queue.length; head++) {
  const at = queue[head];
  if (at === goal) return distance[at];
  for (const next of movesFrom(at)) {
    if (distance[next] === -1) {
      distance[next] = distance[at] + 1;
      queue.push(next);
    }
  }
}
return -1;
```

Mark a place as seen when you add it to the queue, not when you take it out. Otherwise the same place can be added many times before it's reached, and the queue can grow far past n. The `head` index plays the part of `popleft`, so each step is O(1) and the whole search is O(n + moves).

A stack in the same loop would go deep down one path first. It still visits everything, but the first time it reaches the goal might not be the shortest way, so use a queue when the question is "fewest".

Before you start, ask about the edges: an empty input, a single item, a pop or a read on an empty stack, values that repeat, and whether ties count as bigger.
