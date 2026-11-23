# Sliding window

A window is a stretch of neighbouring values in a list or a string, marked by a `left` and a `right` index. Questions about stretches, like the best total over seven days in a row or the longest run of songs with no repeats, can often be answered by sliding one window along the input instead of checking every stretch.

A list of n values has about n²/2 stretches, so checking each one is O(n²) at best. A window touches each value at most twice, once when it enters on the right and once when it leaves on the left, so the whole slide is O(n). The trick is to keep a summary of what's inside the window, like a total or a count of each value, and update it as values come and go instead of working it out again.

## Fixed-size windows

When the question names the size, `k`, the window moves one step at a time. Add the value that enters on the right, take away the one that leaves on the left, and read the answer once the window is full.

```ts
let total = 0;
let best = -Infinity;
for (let right = 0; right < nums.length; right++) {
  total += nums[right];
  if (right >= k) total -= nums[right - k];
  if (right >= k - 1) best = Math.max(best, total);
}
```

Summing each window from scratch costs O(k) per window, so O(nk) in all. Sliding costs O(1) per step, so O(n).

To check whether a window's average is at least some limit, compare its total with `limit * k`. Whole numbers compare exactly, and you never divide.

## Counts inside the window

When the question is about which values are in the window, keep a map from each value to how many times it's in the window. Add one when a value enters, take one away when it leaves, and delete the key when its count reaches 0. Then the map's size is the number of different values in the window. When the values come from a small range, like the 26 lowercase letters, an array of counts does the same job, as in the last chapter.

Often you don't need the whole map to decide whether the window is valid, just one number you keep beside it:

- For "no value twice", keep how many values appear more than once. It changes only when a count goes from 1 to 2 or from 2 to 1.
- For "a rearrangement of this word", keep how many letters have exactly the count the word needs.
- For "holds every letter of this word", keep how many needed letters are still missing.

Updating that number takes O(1) per step, where comparing every count would take time for each value that could appear.

## Windows that grow and shrink

When the size isn't fixed, `right` moves one step every time, and `left` moves only when it has to.

```ts
let left = 0;
for (let right = 0; right < nums.length; right++) {
  // Add nums[right] to the window
  while (windowBreaksTheRule()) {
    // Remove nums[left] from the window
    left++;
  }
  // The window from left to right follows the rule here
}
```

There's a loop inside a loop, but it's still O(n). `left` only ever moves forward, so across the whole run it moves at most n times.

This only works when the rule behaves well as the window changes. For the longest window, shrinking a window that follows the rule must never break it. For the shortest window that meets a goal, growing a window that meets the goal must never undo it. Sums of positive numbers, the number of different values, and "no repeats" all behave that way. Sums that include negative numbers don't, since adding a value can lower the total. That's why the last chapter used prefix sums for those.

### The longest valid window

Shrink while the window breaks the rule, then record its length, `right - left + 1`. Every window you record follows the rule, and the longest one is the answer.

For "no repeated song", you can remember the last position of each song instead of counting. When a song repeats, jump `left` to just past its last position, but never move it backward. A song's last position can be from before the current window, so write `left = Math.max(left, last + 1)`.

### The shortest window that meets a goal

Shrink while the window still meets the goal, and record the length inside that loop, before each value leaves. Once the window stops meeting the goal, grow it again.

```ts
let best = Infinity;
let total = 0;
let left = 0;
for (let right = 0; right < nums.length; right++) {
  total += nums[right];
  while (total >= goal) {
    best = Math.min(best, right - left + 1);
    total -= nums[left];
    left++;
  }
}
return best === Infinity ? 0 : best;
```

For the shortest stretch of text that holds every letter of a word, the window meets the goal when no needed letter is missing. Keep the count of missing letters from the list above, and the loop looks the same.

## Exactly k, by counting at most k twice

Counting windows with exactly k different values doesn't fit the grow and shrink pattern. A window with exactly k values can break the rule by growing, when a new value arrives, and also by shrinking, when the last copy of a value leaves. So there's no single rule for when to move `left`.

"At most k different values" does fit, because shrinking never adds values. For each `right`, every start from `left` to `right` makes a window with at most k values, so there are `right - left + 1` of them. Adding that up counts every such window in O(n). Then the windows with exactly k values are the ones with at most k, minus the ones with at most k - 1.

```ts
function atMost(nums: number[], k: number): number {
  if (k < 0) return 0;
  const counts = new Map<number, number>();
  let windows = 0;
  let left = 0;
  for (let right = 0; right < nums.length; right++) {
    counts.set(nums[right], (counts.get(nums[right]) ?? 0) + 1);
    while (counts.size > k) {
      const leaving = (counts.get(nums[left]) ?? 0) - 1;
      if (leaving === 0) counts.delete(nums[left]);
      else counts.set(nums[left], leaving);
      left++;
    }
    windows += right - left + 1;
  }
  return windows;
}

const exactly = atMost(nums, k) - atMost(nums, k - 1);
```

The first line covers k = 0, where the second call asks for at most -1 values. Without it, the inner loop would never stop.

The same subtraction counts stretches with exactly k of anything, like exactly k rainy days. A list of n values has n(n + 1)/2 stretches, so for long lists the count can be bigger than a 32-bit number holds.

## The maximum of each window

A running total is easy to update when a value leaves, but a maximum isn't. When the largest value slides out, which one is largest now? A heap can answer in O(log k) per step. A monotonic deque does it in O(1) on average.

A deque is a list you can add to and remove from at both ends. Keep the positions of values in it, with their values getting smaller from front to back. When a new value arrives, remove every position from the back whose value is no bigger than the new one. Those values can never be the maximum again, because the new value is at least as big and will stay in the window longer. Then add the new position at the back. The front is always the window's maximum, and when the front position slides out of the window, remove it.

```ts
const deque: number[] = [];
let head = 0;
const highs: number[] = [];
for (let right = 0; right < nums.length; right++) {
  while (deque.length > head && nums[deque[deque.length - 1]] <= nums[right]) {
    deque.pop();
  }
  deque.push(right);
  if (deque[head] <= right - k) head++;
  if (right >= k - 1) highs.push(nums[deque[head]]);
}
```

Each position joins the deque once and leaves at most once, so the whole slide is O(n). The deque stores positions, not values, so you can tell when the front has slid out of the window. In TypeScript, `shift()` can cost O(n) on a long array, so a `head` index marks the front instead. Python has `collections.deque`, and Java has `ArrayDeque`.

Keep a second deque with values getting bigger from front to back, and you also have the minimum. With both, you can grow and shrink a window while its highest and lowest values stay within a limit.

Before you start, ask about the edges: an empty input, a window size bigger than the input, a `k` of 0 or 1, and every value the same.
