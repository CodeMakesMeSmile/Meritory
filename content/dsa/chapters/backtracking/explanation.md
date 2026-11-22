# Recursion and backtracking

Some questions ask for every answer, not just one: every set of gear you could pack, every order a show's acts could run in, or every handful of stamps that makes the postage. Backtracking builds answers one choice at a time. When an answer is finished, or the choices so far can't lead to one, it steps back and tries the next choice instead.

Backtracking is recursion with a little bookkeeping, so this chapter starts with recursion itself.

## A base case and a smaller problem

A recursive function answers a question by asking the same question about something smaller. It needs two parts:

- **A base case**, small enough to answer directly, like an empty list or zero crates.
- **A step** that turns the question into one or more smaller questions of the same shape, then builds its answer from theirs.

The hard part is trusting the smaller call. Don't trace it all the way down in your head. Assume it already works for anything smaller, and only check that your step uses it correctly and that every call gets closer to the base case.

Moving a stack of crates is the classic example. Crates of different sizes sit in bay 1, biggest at the bottom, and must move to bay 3. You move one crate at a time, and a crate can never sit on a smaller one. To move n crates, move the top n - 1 out of the way to bay 2, move the biggest crate to bay 3, then move the n - 1 crates from bay 2 on top of it.

```ts
function move(count: number, from: number, to: number, spare: number, moves: number[][]): void {
  if (count === 0) return;
  move(count - 1, from, spare, to, moves);
  moves.push([from, to]);
  move(count - 1, spare, to, from, moves);
}
```

The base case is zero crates, which needs no moves. Each call makes two calls on one fewer crate, so n crates take 2ⁿ - 1 moves. The two smaller calls do different jobs because the bays are passed in a different order.

A smaller problem doesn't have to be one smaller. To work out x to the power n, work out x to the power n / 2 once and square it, with one more x when n is odd. Halving means 30 calls cover a power of a billion.

Each call waits on the stack until the calls below it finish, so the memory is the depth of the recursion. Python stops at about 1,000 nested calls by default, and other languages run out somewhere in the thousands to tens of thousands. Every exercise in this chapter stays at most about 50 calls deep, so recursion is safe in every language.

## Choose, explore, and undo

Backtracking keeps one list, the **path**, that holds the choices made so far. At each call it tries every choice that's still open: add it to the path, explore everything that follows from it, then take it back off.

```ts
const results: number[][] = [];
const path: number[] = [];

function explore(): void {
  if (finished(path)) {
    results.push([...path]);
    return;
  }
  for (const choice of choicesFor(path)) {
    path.push(choice); // choose
    explore(); // explore
    path.pop(); // undo
  }
}
```

Two details matter.

- **Undo every choice.** Every call shares the same path. When a branch is done, the path must be exactly as it was before that choice, or the next choice starts with leftovers from the last one.
- **Save a copy.** `results.push(path)` would save the path itself, which keeps changing. By the end, every saved answer would be the same empty list. `[...path]` saves the answer as it is right now.

It helps to picture a tree of decisions. The root is the empty path, each edge is one choice, and each leaf is a finished answer or a dead end. Backtracking is a depth-first walk of that tree, like the walks in the trees chapter, except the tree is never built. It only exists as the calls on the stack.

The cost is the number of nodes in that tree, plus copying each answer. That's usually exponential, so look at the input size first. Around 20 items suggests something like 2ⁿ, and around 8 suggests something like n!.

## Every subset

A subset is any choice of items, from none of them to all of them. With n items there are 2ⁿ subsets, since each item is either in or out.

One clean way to list them is to make every node of the decision tree an answer. Each call saves the path, then tries adding each item **after** the last one picked. Passing `i + 1` as the next start is what keeps choices moving forward, so `[1, 2]` and `[2, 1]` can't both appear.

```ts
function subsets(items: number[]): number[][] {
  const results: number[][] = [];
  const path: number[] = [];
  const build = (start: number): void => {
    results.push([...path]);
    for (let i = start; i < items.length; i++) {
      path.push(items[i]);
      build(i + 1);
      path.pop();
    }
  };
  build(0);
  return results;
}
```

For `[1, 2, 3]` this finds `[]`, `[1]`, `[1, 2]`, `[1, 2, 3]`, `[1, 3]`, `[2]`, `[2, 3]`, and `[3]`. Inside each subset the items keep their order from the input. There are 2ⁿ answers of up to n items each, so it's O(n × 2ⁿ) time.

## Every ordering

An ordering uses every item exactly once, but any unused item can go next. So instead of a start position, keep a `used` list and skip anything already on the path.

```ts
const build = (): void => {
  if (path.length === items.length) {
    results.push([...path]);
    return;
  }
  for (let i = 0; i < items.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    path.push(items[i]);
    build();
    path.pop();
    used[i] = false;
  }
};
```

`used[i] = false` is part of the undo, just like `path.pop()`. There are n! orderings, which grows much faster than 2ⁿ: 8 items have 256 subsets but 40,320 orderings, and 10 items have 3,628,800 orderings.

## Combinations that hit a target

To find every set of items that adds up to a target, pass down how much is still needed. A path is finished when nothing is left.

Where the loop starts says whether an item can be used again.

| Next call starts at | Means |
|---|---|
| `i + 1` | Each item is used at most once |
| `i` | The same item can be picked again, but never an earlier one |
| `0`, with a `used` list | Order matters, so it lists orderings, not sets |

Starting at `i` for reuse is the subtle one. Starting at 0 would let you pick 3 and then 2 as well as 2 and then 3, which is the same set found twice. Starting at `i` only ever picks items in order, so each set comes out once, sorted.

With stamps of 2, 3, and 5 and postage of 8, the sets are `[2, 2, 2, 2]`, `[2, 3, 3]`, and `[3, 5]`.

## Skipping duplicates after sorting

When the input repeats a value, the same answer can be built from different copies. The subsets of `[1, 2, 2]` include `[1, 2]` twice, once with each 2.

Sort first, so equal values sit side by side. Then, inside one loop, skip an item that equals the one just before it:

```ts
for (let i = start; i < items.length; i++) {
  if (i > start && items[i] === items[i - 1]) continue;
  path.push(items[i]);
  build(i + 1);
  path.pop();
}
```

The check is `i > start`, not `i > 0`. Picking the second 2 right after the first one is fine, since that's how `[2, 2]` gets built one level down. What's skipped is starting a **second** branch with the same value at the **same** level, because that branch would find exactly what the first one did. With the skip, `[1, 2, 2]` gives `[]`, `[1]`, `[1, 2]`, `[1, 2, 2]`, `[2]`, and `[2, 2]`.

Orderings with repeats use the same idea with `used`. After sorting, skip item `i` when it equals item `i - 1` and item `i - 1` isn't on the path. That forces copies of a value to be used from left to right, so swapping two equal copies never makes a new ordering. `[1, 1, 2]` then gives `[1, 1, 2]`, `[1, 2, 1]`, and `[2, 1, 1]`, once each.

## Pruning early

Pruning means stopping a branch as soon as you know it can't finish. It's often what makes a search fast enough.

- **Sorted values and a target.** If the values are sorted and all positive, once one value is more than what's still needed, every value after it is too. So `break` out of the loop, not just `continue`.
- **Rules about the path so far.** To build every string of n pairs of brackets that close properly, only add `(` while fewer than n are open, and only add `)` while it has something to close. Every path then stays valid, and no finished string has to be checked and thrown away.
- **A cheap test first.** In a word puzzle, a piece that doesn't match can end the branch before any deeper search.

Prune only what truly can't work. If values can be negative, a total that's too big now can still come back down, so stopping early would miss answers.

## Searching a grid for a word

To find whether a word can be traced through a grid of letters, stepping up, down, left, or right without using a cell twice, try starting at every cell. From each one, match the word a letter at a time.

```ts
function trace(r: number, c: number, at: number): boolean {
  if (at === word.length) return true;
  if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
  if (used[r][c] || grid[r][c] !== word[at]) return false;
  used[r][c] = true; // on the path
  const found =
    trace(r + 1, c, at + 1) ||
    trace(r - 1, c, at + 1) ||
    trace(r, c + 1, at + 1) ||
    trace(r, c - 1, at + 1);
  used[r][c] = false; // off the path again
  return found;
}
```

Marking a cell stops the path from using it twice. Clearing it on the way back out is the undo, and forgetting it is the classic bug. A different start, or a different turn earlier on, may need that cell, and a mark left behind blocks it, so the search says no when the answer is yes.

A letter that doesn't match ends the branch at once, which is the pruning. From each cell the path can go four ways at the first step and at most three after that, since the cell it came from is marked, so the worst case is O(rows × cols × 3ᴸ) for a word of length L. A quick count helps too: if the grid holds fewer copies of some letter than the word needs, the answer is no without any search.

The same mark and clear pattern works for any path through a grid that can't visit a cell twice, like the richest walk through a field where each cell can only be picked once.

Before you start, ask about the edges: an empty input, repeated values, whether an item can be used more than once, whether order matters inside each answer, and how many answers there could be.
