# Dynamic programming in one dimension

Dynamic programming, or DP, is for problems where a plain recursion asks the same smaller question again and again. Save each answer the first time you work it out, and an exponential search turns into a loop over a list. In this chapter the list has one dimension: each smaller question is named by one number, like a position, an amount, or a length.

DP answers a count, a best value, or a yes or no. If a question asks you to list every answer, that's backtracking, since the list itself can be exponential.

## Spotting overlapping subproblems

A child hops along a row of stones, one or two stones at a time. How many ways are there to get from the start to stone n? The last hop landed on stone n from stone n - 1 or from stone n - 2, so the ways to reach n are the ways to reach n - 1 plus the ways to reach n - 2.

```ts
function ways(n: number): number {
  if (n <= 1) return 1;
  return ways(n - 1) + ways(n - 2);
}
```

It's right, but it's slow. `ways(5)` calls `ways(4)` and `ways(3)`, and `ways(4)` calls `ways(3)` again. The repeats pile up, and `ways(40)` makes over 300 million calls. Yet there are only 41 different questions, `ways(0)` up to `ways(40)`.

That's the sign to look for. Draw a few levels of the call tree. If the same arguments show up on different branches, and the arguments can only take a small number of values, the subproblems overlap and DP will help.

## Top down with a memo

The smallest change is to keep the recursion and save each answer in a memo, a map from the arguments to the answer. Before working anything out, look it up.

```ts
const memo = new Map<number, number>();
function ways(n: number): number {
  if (n <= 1) return 1;
  const saved = memo.get(n);
  if (saved !== undefined) return saved;
  const answer = ways(n - 1) + ways(n - 2);
  memo.set(n, answer);
  return answer;
}
```

Now each question is worked out once. The time is the number of different questions times the work for each one, here O(n).

Top down is often the easiest version to write, since it reads like the recursion you thought of first, and it only works out the questions it actually needs. The cost is depth. `ways(10000)` waits on `ways(9999)`, which waits on `ways(9998)`, and so on, 10,000 calls deep. Python stops at about 1,000 by default.

## Bottom up with a table

The other way is to fill a table from the smallest question up, so every answer a step needs is already there.

```ts
const table = new Array<number>(n + 1).fill(0);
table[0] = 1;
table[1] = 1;
for (let i = 2; i <= n; i++) {
  table[i] = table[i - 1] + table[i - 2];
}
return table[n];
```

There's no recursion, so nothing can run too deep, and a plain loop is usually faster. The one rule is the order: every entry an entry reads must be filled before it. Here that's left to right, since each entry reads smaller ones.

Every reference solution in this chapter works bottom up in a loop, with a table or with just the few values it still needs.

## The state and the recurrence, in words first

Most DP mistakes come from starting to code before the plan is clear. Write these down first, in plain words.

1. **The state.** What one entry means, in a full sentence. "`best[i]` is the most pay from the first i shifts."
2. **The recurrence.** How an entry comes from smaller ones, usually by naming the choice made at the last step. "Either shift i - 1 isn't worked, so it's `best[i - 1]`, or it is, so the shift before it can't be, and it's `best[i - 2]` plus its pay."
3. **The base cases.** The entries the recurrence can't work out. "`best[0]` is 0, and `best[1]` is the first shift's pay."
4. **The answer.** Which entry, or what combination of entries, answers the question. Often it's the last entry, but not always.

The most common slip is mixing up "the first i items" with "ending at item i". Both are fine states, but they lead to different recurrences and different answers, so pick one and keep to it. Using "the first i" with a table of n + 1 entries gives a clean empty case at index 0.

## Keeping only the last few values

If an entry only reads the one or two entries before it, there's no need to keep the whole table. Two variables hold everything the next step needs, so the memory drops from O(n) to O(1).

```ts
let before = 1; // ways to reach stone i - 2
let last = 1; // ways to reach stone i - 1
for (let i = 2; i <= n; i++) {
  const next = last + before;
  before = last;
  last = next;
}
return last;
```

Work out the new value before overwriting anything it reads. This only works when the recurrence looks back a fixed, small distance. When an entry reads far back, like `fewest[amount - coin]` for any coin, keep the table.

## Take or skip

Many problems give a row of items and ask for the best set, with a rule about which items can go together. At each item there are two choices: take it, or skip it.

A worker can pick shifts from a row, but never two in a row. With pay `[6, 2, 3, 9, 4]`, the best is 6 and 9, for 15. If `best[i]` is the most pay from the first i shifts, then skipping shift i - 1 leaves `best[i - 1]`, and taking it rules out shift i - 2, leaving `best[i - 2]` plus its pay.

| i | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Pay of shift i - 1 | | 6 | 2 | 3 | 9 | 4 |
| `best[i]` | 0 | 6 | 6 | 9 | 15 | 15 |

Each entry reads two before it, so two variables are enough.

**In a circle.** If the items sit in a circle, the first and last are neighbours too. Solve the row twice, once without the last item and once without the first, and take the better answer. Every valid choice leaves out the first item or the last one, so one of the two rows always holds it. A circle of one item is just that item.

## Making change

**The fewest coins.** With coins of some values and as many of each as you like, what's the fewest coins that make an amount? If `fewest[a]` is the fewest coins that make `a`, the last coin could be any value `c` up to `a`, so `fewest[a]` is 1 plus the smallest `fewest[a - c]`. `fewest[0]` is 0. An amount that can't be made stays at infinity, and becomes -1 at the end.

Picking the biggest coin that fits each time doesn't work in general. With coins 1, 3, and 4, the biggest coin first makes 6 as 4, 1, and 1, which is three coins, but 3 and 3 is two.

**Counting the ways.** To count the different sets of coins that make an amount, the order of the loops matters.

```ts
const ways = new Array<number>(amount + 1).fill(0);
ways[0] = 1;
for (const coin of coins) {
  for (let a = coin; a <= amount; a++) {
    ways[a] += ways[a - coin];
  }
}
```

With the coins in the outer loop, each set is built in one fixed order of coins, so it's counted once. With the amounts in the outer loop instead, each entry can end with any coin, so 1 then 2 and 2 then 1 are counted separately. That's the right count for sequences, like hops along a row of stones, but not for sets of coins.

Counts like these grow fast, past what 64 bits can hold. Questions then ask for the count modulo a big prime, usually 1,000,000,007. Take the modulo after every addition, so no value ever grows big. In Java and C, add in a 64-bit type.

## The longest increasing subsequence

A subsequence keeps some of a list's values in their order, not necessarily side by side. The longest strictly increasing one in `[4, 1, 6, 2, 7, 9, 3, 8]` has 4 values, like 1, 2, 7, and 9.

**O(n²).** Let `longest[i]` be the length of the longest increasing subsequence that **ends at** position i. It's 1 plus the best `longest[j]` for an earlier position j with a smaller value, or just 1. The answer is the biggest entry anywhere, not the last one, because the best subsequence can end anywhere.

**O(n log n).** Keep a list `tails`, where `tails[k]` is the smallest value that can end an increasing subsequence of length k + 1. For each value, find the first tail that's at least as big, with the binary search from the binary search chapter. Replace it, or add the value to the end if every tail is smaller. The length of `tails` is the answer.

| Value | 4 | 1 | 6 | 2 | 7 | 9 | 3 | 8 |
|---|---|---|---|---|---|---|---|---|
| `tails` after it | 4 | 1 | 1, 6 | 1, 2 | 1, 2, 7 | 1, 2, 7, 9 | 1, 2, 3, 9 | 1, 2, 3, 8 |

Keeping each tail as small as possible leaves the most room for later values to extend it. `tails` stays sorted, which is what makes the binary search work, but it isn't a real subsequence. After the 3, it holds 1, 2, 3, and 9, though the 9 came before the 3. Only its length is the answer. For a subsequence that's allowed to stay level, search for the first tail that's bigger instead.

**Two sizes at once.** To nest boxes by width and height, both must be strictly smaller. Sort by width going up, and for equal widths by height going down, then find the longest increasing subsequence of the heights. Boxes of equal width can't nest, and putting their heights in falling order stops any two of them from rising together.

## Splitting a string into words

Can a string be split into words from a dictionary, using words as often as you like? Let `ok[i]` say whether the first i letters can be split. `ok[0]` is true, since the empty string needs no words. `ok[i]` is true when some earlier `j` has `ok[j]` true and the letters from `j` to `i` form a word. The answer is `ok[n]`.

```ts
const words = new Set(dictionary);
const ok = new Array<boolean>(text.length + 1).fill(false);
ok[0] = true;
for (let i = 1; i <= text.length; i++) {
  for (let j = Math.max(0, i - longestWord); j < i && !ok[i]; j++) {
    ok[i] = ok[j] && words.has(text.slice(j, i));
  }
}
return ok[text.length];
```

Only look back as far as the longest word, and keep the words in a set. Trying every first word with plain recursion solves the same endings of the string over and over. A string of a's ending in a b, with the words a, aa, and aaa, makes that search take exponential time before it gives up.

To count the ways to split instead, add up `ways[j]` for every `j` that works, instead of asking whether any does.

Before you start, ask about the edges: an empty input, an amount of 0, an amount or a target that can't be reached, how big the answer can get, and whether a top-down recursion would go too deep.
