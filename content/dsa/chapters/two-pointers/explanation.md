# Two pointers

Many list problems seem to need a loop inside a loop, checking every pair of positions. Two pointers often turn that into one pass. You keep two indices into the data, and each one only ever moves in one direction, so between them they take at most n steps. This chapter covers the four shapes the idea takes, and when it's worth sorting the input first so you can use it.

## Why one pass is enough

Checking every pair of n values is O(n²). With two pointers, each step moves at least one index, and neither index ever moves back, so the loop runs at most n times. That makes the search O(n) time and O(1) extra memory.

The speed comes from ruling things out. Every time a pointer moves, a whole group of pairs is dropped without being checked. The approach is only correct if you can say why none of those pairs could be the answer. Get in the habit of saying it out loud: "I can move `left` because nothing it could pair with is big enough."

## From both ends of a sorted list

Put `left` at the start and `right` at the end, and look at the pair they point to.

```ts
let left = 0;
let right = nums.length - 1;
while (left < right) {
  const sum = nums[left] + nums[right];
  if (sum === target) return [left, right];
  if (sum < target) left++;
  else right--;
}
return [];
```

If the sum is too small, `nums[left]` can't be in any answer. Its biggest possible partner is `nums[right]`, and even that isn't enough, so move `left` forward. If the sum is too big, `nums[right]` is paired with the smallest value still in play and it still overshoots, so move `right` back. Each step rules out one value for good.

Sorting is what makes this work. It's the reason "too small" means "move left". On an unsorted list, use the map from the last chapter instead.

The same walk answers related questions. To find the pair closest to a budget without going over, record each sum that fits and keep moving. To check whether text reads the same both ways, compare the two ends and step both pointers inward.

## Move the side that limits you

Some problems from both ends don't need sorted input. They need an argument about which pointer is holding the answer back.

Picture a row of posts, with a banner hung between two of them. The banner is as wide as the gap between the posts and as tall as the shorter post. Start with the widest pair, the first and last posts. Moving the taller post inward can't help. The banner gets narrower, and its height is still capped by the shorter post. So the only move that could find a bigger banner is to drop the shorter post.

```ts
let best = 0;
let left = 0;
let right = heights.length - 1;
while (left < right) {
  const height = Math.min(heights[left], heights[right]);
  best = Math.max(best, height * (right - left));
  if (heights[left] < heights[right]) left++;
  else right--;
}
```

Water held between walls after rain works the same way. The water above a position rises to the lower of the tallest wall on its left and the tallest wall on its right, minus the position's own height. Walk inward from both ends, keeping the tallest wall seen from each side. Whichever side's tallest wall is lower decides the level on that side, because the other side already has a wall at least as tall. Settle that position, add its water, and move that pointer in.

Before you move a pointer in a problem like this, say which pairs you're dropping and why none of them can beat the best you've already found.

## A read pointer and a write pointer

To remove items from an array in place, use one pointer to read every item and another to mark where the next kept item goes.

```ts
let write = 0;
for (let read = 0; read < nums.length; read++) {
  if (nums[read] !== 0) {
    nums[write] = nums[read];
    write++;
  }
}
```

Everything before `write` is the answer so far, in its original order. `write` never gets ahead of `read`, so nothing is overwritten before it has been read. The whole job is O(n) time and O(1) memory. Removing items one at a time with `splice` in TypeScript, `del` in Python, or `remove` on an `ArrayList` shifts everything after each one, which adds up to O(n²).

When you're done, the slots from `write` to the end still hold old values. Fill them with whatever the problem asks for, like zeros moved to the back or a marker for an empty slot.

The same pattern removes repeats from a sorted list. Keep an item when it differs from the last item written, since repeats in a sorted list always sit next to each other.

You'll also hear this called fast and slow pointers. The name comes up again with linked lists, where two pointers move through the same list at different speeds.

## Partition in place

To partition a list is to rearrange it so the items that pass a test come first. A boundary pointer marks the end of the passing items, and a second pointer scans the rest. When the scan finds a passing item, swap it to the boundary and move the boundary along.

Three groups need three pointers. To sort a list of 0s, 1s, and 2s in one pass, keep everything before `low` as 0s, everything from `low` up to `mid` as 1s, and everything after `high` as 2s. The items from `mid` to `high` haven't been looked at yet.

```ts
let low = 0;
let mid = 0;
let high = nums.length - 1;
while (mid <= high) {
  if (nums[mid] === 0) {
    [nums[low], nums[mid]] = [nums[mid], nums[low]];
    low++;
    mid++;
  } else if (nums[mid] === 2) {
    [nums[mid], nums[high]] = [nums[high], nums[mid]];
    high--;
  } else {
    mid++;
  }
}
```

After a swap with `high`, `mid` stays where it is, because the value that just arrived from the end hasn't been checked. After a swap with `low`, `mid` can move on, because anything between `low` and `mid` is already known to be a 1.

Partitioning is the step at the heart of quicksort, and of quickselect, which finds the k-th smallest value without sorting everything. Partition around a pivot value, and the pivot ends up exactly where it would be in sorted order. Then you only need to keep going on the side that holds position k. On average each partition halves the work, so the total is about n + n/2 + n/4 and so on, which is O(n). A bad pivot every time makes it O(n²), so pick the pivot at random.

Swapping doesn't keep items in their original order within each group. When order matters, copy with a read and a write pointer instead.

## Merging two sorted lists

Keep a pointer at the front of each list. Take the smaller of the two front values, move that pointer along, and repeat. When one list runs out, copy the rest of the other.

```ts
const merged: number[] = [];
let i = 0;
let j = 0;
while (i < first.length && j < second.length) {
  if (first[i] <= second[j]) merged.push(first[i++]);
  else merged.push(second[j++]);
}
while (i < first.length) merged.push(first[i++]);
while (j < second.length) merged.push(second[j++]);
```

Every step places one value, so merging lists of n and m values is O(n + m). Taking from the first list on a tie keeps equal values in their original order, which is what makes merge sort stable.

The same walk finds the values two sorted lists share. When the fronts are equal, record the value and move both pointers. Otherwise move the pointer at the smaller value, since it can't match anything left in the other list.

## When to sort first

Sorting costs O(n log n). It's worth paying when it lets you use two pointers in place of something slower.

| Problem | Without sorting | Sort first |
|---|---|---|
| A pair with a given sum, and you need the original positions | A map, O(n) | Loses the positions, so don't |
| Every set of three values that adds to 0, each set once | Three loops, O(n³) | Fix one value and walk two pointers, O(n²) |
| Every different pair of values with a given sum | A map, plus care with repeats | Two pointers, and repeats sit side by side |
| The k-th smallest value | Sorting everything is O(n log n) | Quickselect is O(n) on average, so don't |

Sort first when the slow way is O(n²) or worse, when you don't need the original positions, or when answers must be reported once each. Don't sort when a map already gives O(n) and the positions matter.

In TypeScript, `nums.sort()` with no argument compares values as text, so 10 comes before 9. Always pass `(a, b) => a - b` for numbers.

## Skipping repeats

To find every set of three amounts that adds to 0, sort the amounts, fix the first value of the set, and look for the other two with pointers from both ends of the rest. Repeated amounts would make the same set appear more than once. Because the list is sorted, repeats sit next to each other, so you can skip them without a set.

```ts
nums.sort((a, b) => a - b);
for (let i = 0; i < nums.length - 2; i++) {
  if (i > 0 && nums[i] === nums[i - 1]) continue;
  let left = i + 1;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[i] + nums[left] + nums[right];
    if (sum < 0) left++;
    else if (sum > 0) right--;
    else {
      found.push([nums[i], nums[left], nums[right]]);
      left++;
      right--;
      while (left < right && nums[left] === nums[left - 1]) left++;
    }
  }
}
```

Skip a first value that's the same as the one before it, because it would find the same sets again. After finding a set, move `left` past every copy of its value. `right` doesn't need its own skip, since a copy of the old right value now adds to more than 0, and the next step moves it.

Before you start, ask about the edges: an empty list, a list too short to hold an answer, every value the same, and negative numbers.
