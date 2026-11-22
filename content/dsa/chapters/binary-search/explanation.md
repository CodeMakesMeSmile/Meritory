# Binary search

Binary search finds something in sorted data by halving the part still in question at every step. A million sorted values take about 20 steps, and a billion take about 30, so it's O(log n). The idea is easy. The hard part is the edges: whether the loop runs while `lo < hi` or `lo <= hi`, whether `hi` moves to `mid` or `mid - 1`, and what's returned at the end. Small slips there cause loops that never end and answers that are one place off.

This chapter uses one way of writing it, the same way every time, so there's only one set of rules to remember.

## One question: where does the check turn true?

Every binary search in this chapter answers the same question. You have positions in order, and a yes or no check that's false for a while and then true from some point on:

```text
position:  0      1      2      3     4     5
check:     false  false  false  true  true  true
```

Find the first position where the check is true. For "where is 7 in this sorted list?", the check is "is the value here at least 7?". For "what's the slowest pace that still finishes in time?", the positions are paces and the check is "does this pace finish in time?". Once you can phrase a problem that way, the code below solves it.

The check must never go back from true to false. That's the one thing binary search needs, and it's what sorted order gives you.

## The half-open template

Keep two numbers, `lo` and `hi`, and promise that this stays true at every step:

- Every position before `lo` fails the check.
- Every position from `hi` on passes it.

The positions from `lo` up to but not including `hi`, written `[lo, hi)`, are the only ones still unknown. That's called a half-open range.

```ts
let lo = 0;
let hi = n;
while (lo < hi) {
  const mid = lo + Math.floor((hi - lo) / 2);
  if (check(mid)) hi = mid;
  else lo = mid + 1;
}
return lo;
```

At the start nothing is known, so `lo` is 0 and `hi` is n, one past the last position. Pretend position n passes, so the promise holds even when nothing does. Each step looks at `mid`, inside the unknown range. If it passes, everything from `mid` on passes, so `hi` moves to `mid`. If it fails, everything up to `mid` fails, so `lo` moves to `mid + 1`. When the unknown range is empty, `lo` equals `hi`, and that's the first position that passes. If it's n, nothing passed.

Here's the search for the first value of at least 4 in `[2, 4, 4, 7, 9]`.

| lo | hi | mid | Value at mid | At least 4? | Move |
|---|---|---|---|---|---|
| 0 | 5 | 2 | 4 | Yes | `hi = 2` |
| 0 | 2 | 1 | 4 | Yes | `hi = 1` |
| 0 | 1 | 0 | 2 | No | `lo = 1` |
| 1 | 1 | | | | Stop, the answer is 1 |

## Avoiding off-by-one errors

Every rule here comes from the promise, so you can work each one out again if you forget it.

- **The loop runs while `lo < hi`.** That's while the unknown range has anything in it. With `lo <= hi` the loop would look at `hi`, which isn't unknown.
- **`mid` rounds down.** Then `lo <= mid < hi`, so `mid` is always inside the unknown range.
- **A pass moves `hi` to `mid`, not `mid - 1`.** `mid` might be the first pass, so it can't be thrown away.
- **A fail moves `lo` to `mid + 1`, not `mid`.** `mid` is known to fail. Setting `lo = mid` can also loop forever when `hi = lo + 1`, since `mid` would be `lo` again.
- **Write the midpoint as `lo + (hi - lo) / 2`.** In Java and C, `(lo + hi) / 2` can go past the largest 32-bit number when both are big. The subtraction never does.
- **Every step shrinks the range.** Both moves make it at least one smaller, so the loop always ends after about log₂(n) steps.

The answer is `lo`, a position from 0 to n. To find the **last** position where something holds, find the first position where it stops holding and subtract 1. The largest whole number whose square is at most n is one less than the first whose square is more than n.

Test every binary search on an empty list, a list of one, a list of two, and a target that's smaller or bigger than everything. Those are where off-by-one errors show up.

## Finding a value, and its first and last positions

To look for `target` in a sorted list, find the first position whose value is at least `target`. That's where it would go to keep the list sorted. If that position is inside the list and holds `target`, you've found it. If not, it isn't there.

With repeats, the same search finds the **first** copy. The first value **bigger** than `target` is just past the **last** copy, so the copies run from the first search's answer to one before the second's.

```ts
function firstAtLeast(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

const start = firstAtLeast(nums, target);
const end = firstAtLeast(nums, target + 1);
// The copies sit at start to end - 1, and there are end - start of them
```

For whole numbers, "bigger than `target`" is the same as "at least `target + 1`". Two O(log n) searches count every copy, even when there are millions of them. Finding one copy and walking outward would be O(n) when most of the list is that value.

Python has this built in as `bisect_left` and `bisect_right`, and Java's `Arrays.binarySearch` finds a copy but not necessarily the first one. Writing it yourself is worth practising, since interviews often ask for it.

## Rotated sorted lists

A sorted list that's been rotated starts partway through and wraps around, like `[40, 50, 60, 10, 20, 30]`. It isn't sorted, but it's still made of two sorted runs, and binary search still works on it when the values are all different.

**The minimum.** Compare each value with the last one. Every value in the first run is bigger than the last value, and every value in the second run, from the minimum on, is at most the last value. So the check "is the value here at most the last value?" is false, then true, and the first true is the minimum.

```text
value:            40     50     60     10    20    30
at most 30?       false  false  false  true  true  true
```

If the list wasn't rotated at all, every value is at most the last, and the search returns position 0, which is right.

**A value.** Find the minimum's position, `p`, first. If `target` is at most the last value, it can only be in the second run, from `p` to the end. Otherwise it can only be in the first run, before `p`. Each run is sorted, so search it with `firstAtLeast` on that part. That's two binary searches, so still O(log n).

Repeated values break this. In `[2, 2, 2, 1, 2]`, the check "at most the last value" goes true, true, true, true, true, and the 1 can't be told apart from its neighbours without looking at them. With repeats, the worst case is O(n), so always ask whether values can repeat.

## Searching the answer space

Sometimes the list you search isn't in the input at all. Say a reader has chapters of different lengths and a few hours, and you want the slowest reading pace that finishes in time. Paces from 1 up are the positions. The check is "does this pace finish in time?". A faster pace never takes longer, so the check goes from false to true exactly once. Binary search over paces with the same template.

```ts
function hoursAt(pace: number): number {
  let hours = 0;
  for (const pages of chapters) hours += Math.ceil(pages / pace);
  return hours;
}

let lo = 1;
let hi = Math.max(...chapters);
while (lo < hi) {
  const mid = lo + Math.floor((hi - lo) / 2);
  if (hoursAt(mid) <= limit) hi = mid;
  else lo = mid + 1;
}
return lo;
```

Pick the range so the promise holds at the start. `lo` is the smallest answer that could possibly work. `hi` is an answer you know passes, like the longest chapter, which finishes each chapter in one hour. Each check costs O(n), and there are O(log m) checks, where m is the size of the range, so the whole search is O(n log m).

The signs of an answer space problem are a question like "the smallest x that works" or "the largest x that's still safe", a range x can come from, and a check that gets easier, or harder, as x grows. Making a check like "can every parcel go out in d days with this van?" is often a simple greedy pass, even when finding the best answer directly would be hard.

Watch the sizes. Adding up hours across many long chapters can go past 2³¹, so use `long` in Java and C. In TypeScript, `Math.max(...list)` can fail on a very long list, so a loop is safer there.

## Sorted grids

**A grid sorted as one list.** When each row is sorted and each row starts after the last one ends, the grid is one sorted list cut into rows. Search positions 0 to rows × cols with the template, and read position `i` from row `Math.floor(i / cols)` and column `i % cols`. That's O(log(rows × cols)).

**Each row sorted on its own.** Binary search each row, for O(rows × log cols). Finding the first 1 in a row of 0s and 1s is the template with the check "is this a 1?".

**Rows and columns both sorted.** When values rise along every row and down every column, start at the top right. If the value there is too big, nothing below it in that column can help, so step left. If it's too small, nothing left of it in that row can help, so step down. Each step drops a row or a column, so it's O(rows + cols). The same walk counts how many values are at most some `x` in O(rows + cols), which you can use as the check in an answer space search to find the k-th smallest value in the grid.

Before you start, ask about the edges: an empty list or grid, one item, values that repeat, a target outside every value, and numbers big enough to overflow when you add or multiply them.
