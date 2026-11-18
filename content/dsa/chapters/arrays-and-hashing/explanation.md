# Arrays and hashing

Most interview problems hand you a list of values. This chapter covers what a list costs to work with, how a hash table finds things in about the same time no matter how much it holds, and six patterns that come from putting the two together.

## Arrays

An array keeps its values side by side in memory. To read index `i`, the computer takes the address of the first value and adds `i` times the size of one value. That's one calculation however long the array is, so reading or writing by index is O(1).

Keeping values side by side has a cost when the array changes in the middle.

| Operation | Cost | Why |
|---|---|---|
| Read or write by index | O(1) | One address calculation |
| Find a value | O(n) | Nothing tells you where it is, so you check each one |
| Add or remove at the end | O(1) on average | Nothing else moves |
| Add or remove anywhere else | O(n) | Every value after it shifts over by one |
| Copy a slice of k values | O(k) | A slice is a new array, so each value is copied |

Lists in Python, `ArrayList` in Java, and arrays in TypeScript grow on their own. When one runs out of room, it moves everything into a bigger block, often about twice the size. That move is O(n), but it happens so rarely that adding to the end still averages O(1).

Two habits follow from this:

- Slicing inside a loop quietly turns an O(n) loop into O(n²). Pass a start and an end index instead.
- Building a string by adding to it in a loop copies the string each time in many languages. Collect the pieces in a list and join them once.

Before you start, ask about the edges: an empty list, a list of one value, repeated values, and negative numbers. Most wrong answers in this chapter come from one of those four.

## Hash tables

A hash table stores keys, or keys with values, so you can ask "is this key here?" without checking every entry. A **set** stores only keys. A **map** stores a value with each key.

### How a lookup works

1. A **hash function** turns the key into a whole number, its hash code.
2. The table reduces that number to a slot, often with the remainder after dividing by the number of slots.
3. It looks in that slot for an entry whose key is equal to yours.

If the hash function spreads keys evenly, each slot holds about one entry, so a lookup, an insert, or a delete takes O(1) time on average.

### Collisions

There are more possible keys than slots, so two different keys will sometimes land in the same slot. This is a collision, and tables handle it in one of two ways. With **chaining**, each slot holds a short list of the entries that landed there. With **open addressing**, every entry lives in the slot array itself, and a key that finds its slot taken tries the next slot in a fixed order until it finds a free one. Interviewers rarely ask for more detail than that, but you should know the cost: if every key lands in the same slot, each lookup checks them all, and the O(1) operations become O(n).

### Growing the table

The **load factor** is the number of entries divided by the number of slots. As it rises, collisions get more likely and lookups slow down. So a table grows before it gets too full. Java's `HashMap`, for example, about doubles its slots once it's three quarters full, and every entry moves to its new slot. Like a growing array, the move is O(n) but rare, so inserts still average O(1).

### What can be a key

A key needs two things. Equal keys must give equal hash codes, or the table looks in the wrong slot. And the key must not change while it's in the table, or its hash code changes and the entry is lost.

Each language handles this a little differently:

- **Python**: `dict` and `set` take numbers, strings, and tuples, but not lists, because a list can change. Turn a list into a tuple to use it as a key.
- **Java**: `HashMap` and `HashSet` use `hashCode` and `equals`. Strings, boxed numbers, and records work as keys. Iteration order isn't guaranteed, so use `LinkedHashMap` when you need keys back in the order you added them.
- **TypeScript**: `Map` and `Set` compare numbers and strings by value, but arrays and objects by identity. Two arrays holding the same letters are two different keys, so build a string key, like the letters joined together.
- **C**: there's no built-in hash table. When the keys fall in a small range, like the 26 lowercase letters, an array of counts indexed by the key does the job. That's called direct addressing. Otherwise, write a small open addressing table.

### Trading memory for time

Checking whether a value is in a list is O(n). Put the list in a set first, and each check is O(1) on average, at the cost of O(n) extra memory. Almost every pattern below makes that trade: one pass to remember what you've seen, so later questions are cheap.

## Patterns

### Look up what you still need

To find two values that add up to a target, you don't need to try every pair. For each value, the partner you need is `target - value`. Walk the list once, and before you remember the current value, check whether its partner has already been seen.

```ts
const seen = new Map<number, number>();
for (let i = 0; i < nums.length; i++) {
  const partner = seen.get(target - nums[i]);
  if (partner !== undefined) return [partner, i];
  if (!seen.has(nums[i])) seen.set(nums[i], i);
}
return [];
```

Checking before adding stops a value from pairing with itself. The same idea works for any partner you can compute, like a value exactly `k` away.

### Count, then compare

When the question is about how many of each thing there are, count them into a map and compare the counts. Two words use the same letters when their letter counts match. A word can be spelled from a pile of tiles when no letter is needed more often than the pile has it. Counting is O(n), where sorting both inputs to compare them is O(n log n). If the keys are small and fixed, like lowercase letters, an array of 26 counts is simpler than a map.

### Group by a key you build

To sort items into groups, build a key that's the same for every item in a group and different between groups, then use a map from key to group. Words with the same letters share their sorted letters as a key. Codes that are the same letters shifted along the alphabet share the gaps between their letters. Most of the work is choosing the key. Check it against two items that belong together and two that don't.

### Prefix sums with a map

A prefix sum is the total of everything up to a point. The sum of the stretch between two points is the later prefix sum minus the earlier one. So to count the stretches that add up to `total`, walk the list keeping the running sum, and at each point ask how many earlier prefix sums equal `sum - total`. A map from prefix sum to how many times you've seen it answers that in O(1).

```ts
const counts = new Map<number, number>([[0, 1]]);
let sum = 0;
let found = 0;
for (const value of values) {
  sum += value;
  found += counts.get(sum - total) ?? 0;
  counts.set(sum, (counts.get(sum) ?? 0) + 1);
}
```

The map starts with a sum of 0 seen once, for stretches that begin at the very first value. This works with negative numbers, where a sliding window doesn't, because adding a value can make the sum go down.

To find the longest stretch instead of counting them, store the first index where each prefix sum appeared.

### Runs with a set

To find runs of consecutive numbers in an unsorted list, sorting works in O(n log n). A set does it in O(n). Put every number in the set, then only start counting from a number whose predecessor isn't in the set, because that number starts a run. Count upward while the next number is there. Each number is counted once as part of one run, so the whole walk is O(n) even with the inner loop.

### A pass from each side

Some answers depend on everything to the left of a position and everything to the right. Instead of looking both ways from every position, which is O(n²), make one pass from the left to collect what's before each position and one from the right to collect what's after it. The product of all the other numbers is the product before a position times the product after it. A balance point is where the sum before it equals the sum after it. Both take O(n) time, and often the second pass can reuse the answer array, so the only extra memory is one running value.
