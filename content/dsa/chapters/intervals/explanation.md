# Intervals

An interval is a stretch of time or space with a start and an end, like a booking from 9 to 10 or a road closure from kilometre 3 to kilometre 8. The cases write one as `[start, end]`, and a list of them as `int[][]`.

Nearly every interval question comes down to two moves: sort the intervals, then walk them once while keeping a little state, like the end of the group so far or a running count. The sort is O(n log n) and the walk is O(n), so most answers here are O(n log n), and O(n) when the input comes sorted.

## Do touching intervals overlap?

Before anything else, settle what happens when one interval ends exactly where the next begins, like `[1, 3]` and `[3, 5]`. Questions answer it both ways, and the answer changes the comparisons in your code.

- **They don't overlap** when the intervals are **half-open**: each covers its start and runs up to its end, without the end itself. A meeting from 9 to 10 is over at 10, so another can start at 10 in the same room. Two half-open intervals overlap only when each starts before the other ends: `a[0] < b[1] && b[0] < a[1]`.
- **They do overlap** when the intervals are **closed**: each covers both its start and its end. A gauge that can be read from minute 1 through minute 3 and another from minute 3 through minute 5 can both be read at minute 3. The test becomes `a[0] <= b[1] && b[0] <= a[1]`.

Merging adds a third case. Bookings `[1, 3]` and `[3, 5]` don't overlap, but together they keep a hall busy from 1 to 5 with no gap, so a question about busy times usually joins them.

Every statement in this chapter says which rule it uses. In an interview, ask, since it's the most common way to be off by one.

## Sorting by start or by end

Sorting puts intervals that could affect each other next to each other. Which end to sort by depends on the question.

**Sort by start** when you're building groups, like merging or adding a booking. Once the intervals are in order of start, a new interval can only join the group just before it, since every earlier group ended before that one began. So you only ever compare with the last group.

**Sort by end** when you're choosing which intervals to keep, like fitting the most talks onto one stage. The talk that ends first leaves the most room for everything after it, so it's always safe to keep.

Here's why the choice matters. Take talks `[1, 10]`, `[2, 3]`, and `[4, 5]`. Sorted by start, `[1, 10]` comes first, and keeping it rules out both others, so a plan that keeps the first talk it sees ends with one. Sorted by end, `[2, 3]` comes first, then `[4, 5]`, and both fit, so the answer is two.

Sort a copy, so the input stays as it was, and always pass a compare function. In TypeScript, `sort()` with no function compares as text, which puts `[10, 11]` before `[9, 12]`. In Java, compare with `Integer.compare(a[0], b[0])` rather than subtracting, as in the heaps chapter.

## Merging overlaps

Sort by start, then walk the intervals, keeping the group you're building. If the next interval starts at or before the group's end, it joins, and the group's end becomes the larger of the two ends. Otherwise the group is finished, and the next interval starts a new one.

```ts
const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
const merged: number[][] = [];
for (const [start, end] of sorted) {
  const last = merged[merged.length - 1];
  if (last && start <= last[1]) {
    last[1] = Math.max(last[1], end);
  } else {
    merged.push([start, end]);
  }
}
```

Two details catch people. Keep the larger end, not the new one, since `[1, 10]` followed by `[2, 3]` still ends at 10. And `start <= last[1]` joins touching intervals. Use `<` when touching ones stay apart.

The code pushes a new `[start, end]` rather than the input's own array, so changing `last[1]` never changes the caller's interval.

## Adding to a sorted list

Sometimes the list is already sorted by start, with no overlaps, and one new interval arrives. Merging everything again works, but the sort costs O(n log n) when one pass is O(n). Walk the list in three parts.

1. Copy every interval that ends before the new one starts. These come first, untouched.
2. Fold in every interval that overlaps the new one, widening it to the smaller start and the larger end.
3. Add the widened interval, then copy the rest.

```ts
const result: number[][] = [];
let [start, end] = added;
let i = 0;
while (i < list.length && list[i][1] < start) result.push(list[i++]);
while (i < list.length && list[i][0] <= end) {
  start = Math.min(start, list[i][0]);
  end = Math.max(end, list[i][1]);
  i++;
}
result.push([start, end]);
while (i < list.length) result.push(list[i++]);
```

The `<` in the first loop and the `<=` in the second both join touching intervals. Use `<=` and `<` instead when touching ones stay apart. The new interval may overlap nothing, so the middle loop never runs and it slots in between, or it may swallow the whole list.

**Taking a stretch out** works the same way. Copy the intervals that end before it, keep the ones that start after it, and for each interval in between keep whatever sticks out on the left, `[start, cut start]`, and on the right, `[cut end, end]`, when that piece has any length. One interval can split in two this way.

## Removing the fewest so nothing overlaps

Given talks for one stage, what's the fewest to cancel so the rest don't clash? Turn it around: keep as many as possible, and cancel the others.

Sort by end. Keep the first talk, then walk the rest, keeping each talk that starts at or after the end of the last one kept. The answer is the number of talks minus the number kept.

Why is the earliest end always safe? Take any best plan. Its first talk ends no earlier than the talk that ends first overall, so swap that one in. The new first talk ends sooner, so it clashes with nothing the old one didn't, and the plan still keeps the same number of talks. Then do the same for the talks after it. This is an **exchange argument**, and the greedy chapter leans on it again and again.

The same walk answers a close cousin: the fewest moments that **touch** every interval, like the fewest visits that read every gauge inside its window. Sort by end and visit at the end of the first window. That visit reads every window that has opened by then, since none of the rest has closed yet. Skip those, and visit again at the end of the next window that wasn't read.

## The most at once, with a sweep

How many intervals are open at the busiest moment? The heaps chapter answers this for meeting rooms with a heap of end times. A **sweep** is a second way, and it bends to more variations.

Turn each interval into two events: `+1` at its start and `-1` at its end. Sort the events by time, then walk them with a running count. The largest count seen is the answer.

```ts
const events: number[][] = [];
for (const [start, end] of intervals) {
  events.push([start, 1], [end, -1]);
}
// At the same time, ends come first, so touching intervals never count together
events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
let open = 0;
let most = 0;
for (const [, change] of events) {
  open += change;
  most = Math.max(most, open);
}
```

**Ties decide the answer.** When one interval ends at 10 and another starts at 10, the order of those two events matters. Ends first means the count drops before it rises, so the two never count together, which is the rule for half-open intervals. Starts first counts them together, which is the rule for closed ones. The second sort key above puts `-1` before `+1`. Flip it to put starts first.

With whole-number times there's another way to handle closed intervals: put each end event one step later, at `end + 1`, and keep ends first. An interval closed at minute 5 covers exactly the same minutes as one that runs up to 6.

An event can carry more than 1. To find the peak power drawn by appliances, add each one's watts at its start and take them away at its end. Nothing else changes.

The heaps chapter's other answer, sorting the starts and the ends as two separate lists and walking both, is this same sweep with the events kept in two lists.

## Intersecting two sorted lists

Two people each have a list of free times, sorted, with no overlaps inside either list. When are both free? Walk the two lists with two pointers, as in the two pointers chapter.

At each step, the two current intervals share the stretch from the later start to the earlier end. If that stretch has any length, it's part of the answer. Then move past whichever interval ends first, since it can't reach anything later in the other list.

```ts
let i = 0;
let j = 0;
while (i < a.length && j < b.length) {
  const start = Math.max(a[i][0], b[j][0]);
  const end = Math.min(a[i][1], b[j][1]);
  if (start < end) both.push([start, end]);
  if (a[i][1] < b[j][1]) i++;
  else j++;
}
```

Use `start < end` when a shared moment with no length doesn't count, and `start <= end` when it does. Every step moves one pointer, so it's O(n + m), with no sorting at all.

## Free time across several calendars

When is nobody busy? Free time is whatever the busy times don't cover. Put the busy times from every calendar together, merge them, and the gaps between the merged groups are the free times.

Each calendar is already sorted, so this is the merge of k sorted lists from the heaps chapter. A heap holding each calendar's next busy time gives them all in order in O(N log k), where N is the number of busy times in all. Gathering everything and sorting it is O(N log N), which is simpler and usually fine.

Then walk the busy times in order of start, keeping where the free time would begin. If the question gives a day to search within, start at the start of the day, and stop at its end.

```ts
let free = dayStart;
for (const [start, end] of busy) {
  if (start > free) gaps.push([free, Math.min(start, dayEnd)]);
  free = Math.max(free, end);
  if (free >= dayEnd) break;
}
if (free < dayEnd) gaps.push([free, dayEnd]);
```

Busy times that start before the day only move `free` forward, and the last gap runs to the end of the day. Busy times that touch leave no gap, since `start > free` is false when one ends at 10 and the next starts at 10.

Before you start, ask about the edges: whether touching intervals overlap, an empty list, a single interval, intervals that share a start or an end, one interval inside another, and whether the input is already sorted.
