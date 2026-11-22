# Dynamic programming in two dimensions

In the one dimensional chapter, each smaller question was named by one number. Many problems need two. A spot in a grid is a row and a column. Comparing two strings means a prefix of the first and a prefix of the second. A stretch of a list runs from one index to another. The table becomes a grid, but the plan stays the same: say the state, the recurrence, the base cases, the fill order, and the answer, in words, before writing code.

## Two indexes and a fill order

The new part is the fill order. In one dimension it was nearly always left to right. In two, look at which entries the recurrence reads.

- If an entry reads the one above it, the one to its left, and the one up and to the left, fill row by row from the top, and each row from left to right. Everything it reads is then ready.
- If an entry for a range reads shorter ranges inside it, fill by length, shortest first. Row by row would read ranges that aren't filled yet.

Every reference solution in this chapter fills its table in loops, with no recursion, so nothing runs too deep.

## Paths through a grid

A robot starts in the top left cell of a grid and moves one cell right or one cell down at a time until it reaches the bottom right. How many paths are there? The last move into a cell came from above or from the left, so if `paths[r][c]` counts the paths that reach cell (r, c), it's the paths into the cell above plus the paths into the cell to the left.

```ts
paths[r][c] = (r > 0 ? paths[r - 1][c] : 0) + (c > 0 ? paths[r][c - 1] : 0);
```

The only base case is the start, `paths[0][0] = 1`. A cell off the grid has no paths, which is what the checks for `r > 0` and `c > 0` say.

**Blocked cells.** If some cells are walls, a wall has 0 paths into it, and nothing else changes. With a wall in the middle of a 3 by 3 grid, the table fills like this.

| | Column 0 | Column 1 | Column 2 |
|---|---|---|---|
| Row 0 | 1 | 1 | 1 |
| Row 1 | 1 | 0 (wall) | 1 |
| Row 2 | 1 | 1 | 2 |

A common slip is to set the whole top row and left column to 1 before the loop. That's right with no walls, but a wall in the top row blocks every cell to its right, and the shortcut misses it. Treating every cell, the edges included, with the same recurrence avoids the bug. If the start or the end is a wall, the answer is 0.

**The cheapest path.** If each cell has a cost and the path pays for every cell it stands on, `cheapest[r][c]` is the cell's own cost plus the smaller of `cheapest[r - 1][c]` and `cheapest[r][c - 1]`. A cell off the grid counts as infinity, so it's never picked. It's the same table in the same order, with the smaller of two in place of their sum.

Path counts grow fast. An 18 by 18 grid with no walls already has more than 2³¹ paths, so questions ask for the count modulo 1,000,000,007, as in the one dimensional chapter.

This only works because every move goes right or down, so no path can come back to a cell it has left. If a path can also move up or left, cells depend on each other in circles, and no fill order works. That's a shortest path search from the graphs chapter instead.

## Two strings, two prefixes

When a problem compares two strings, the state is nearly always a prefix of each. `table[i][j]` answers the question for the first i letters of `a` and the first j letters of `b`. The table has `a.length + 1` rows and `b.length + 1` columns, so row 0 and column 0 stand for an empty prefix. Those are the base cases, and they're almost always easy.

The recurrence looks at the last letter of each prefix, `a[i - 1]` and `b[j - 1]`, and names what happens to them.

### The longest common subsequence

A common subsequence of two strings is a subsequence of both, keeping the letters in order but not necessarily side by side. `tiger` and `timber` share `tier`, so their longest common subsequence has 4 letters. Let `lcs[i][j]` be its length for the first i letters of `a` and the first j letters of `b`.

- **The last letters match.** Then they can end a longest common subsequence together, so `lcs[i][j] = lcs[i - 1][j - 1] + 1`.
- **They don't match.** At least one of them isn't in the answer, so drop the last letter of one string or the other and keep the better result: `lcs[i][j] = max(lcs[i - 1][j], lcs[i][j - 1])`.

Row 0 and column 0 are 0, since an empty prefix shares nothing. The answer is the bottom right entry, after O(n × m) work. Here's the table for `acre` down the side and `care` across the top.

| | "" | c | a | r | e |
|---|---|---|---|---|---|
| "" | 0 | 0 | 0 | 0 | 0 |
| a | 0 | 0 | 1 | 1 | 1 |
| c | 0 | 1 | 1 | 1 | 1 |
| r | 0 | 1 | 1 | 2 | 2 |
| e | 0 | 1 | 1 | 2 | 3 |

The answer is 3, for `are` or `cre`.

Other questions are this one in disguise. The fewest letters to delete from both strings so that they read the same is `n + m - 2 × lcs`, since everything outside the shared subsequence must go. The same recurrence works on lists of numbers, too.

### Edit distance

An edit inserts a letter, deletes a letter, or replaces one letter with another. The edit distance from `a` to `b` is the fewest edits that turn `a` into `b`. Let `edits[i][j]` be the fewest edits that turn the first i letters of `a` into the first j letters of `b`.

- **Base cases.** `edits[i][0] = i`, since turning i letters into nothing takes i deletes. `edits[0][j] = j`, since building j letters from nothing takes j inserts.
- **The last letters match.** They need no edit, so `edits[i][j] = edits[i - 1][j - 1]`.
- **They don't.** Something has to happen at the end, so it's 1 plus the smallest of three choices.

```ts
edits[i][j] =
  1 +
  Math.min(
    edits[i - 1][j - 1], // replace a's last letter with b's
    edits[i - 1][j], // delete a's last letter
    edits[i][j - 1], // insert b's last letter
  );
```

Turning `form` into `from` takes 2 edits, two replaces in the middle.

| | "" | f | r | o | m |
|---|---|---|---|---|---|
| "" | 0 | 1 | 2 | 3 | 4 |
| f | 1 | 0 | 1 | 2 | 3 |
| o | 2 | 1 | 1 | 1 | 2 |
| r | 3 | 2 | 1 | 2 | 2 |
| m | 4 | 3 | 2 | 2 | 2 |

If the three edits cost different amounts, put each cost in place of the 1, and use the costs in the base cases too. The smallest still wins, so if a replace costs more than a delete and an insert together, the table never picks it.

## Choosing items once: 0/1 knapsack

A van can carry a total weight of `capacity`. Each crate has a weight and a value, and each crate can go in at most once. Which crates give the most value? That "at most once" is the difference from the coins in the one dimensional chapter, where any coin could be used again.

Let `best[i][w]` be the most value from the first i crates with a total weight of at most `w`. Name the choice about crate i - 1.

- **Skip it.** The best is `best[i - 1][w]`.
- **Take it,** if it fits. The best is its value plus `best[i - 1][w - weight]`.

Both choices read row i - 1, the row from before this crate was considered. That's what keeps each crate to once: the row it reads can't already include it. Row 0 is all 0, since no crates give no value, and the answer is `best[n][capacity]`.

The time is O(n × capacity). That's fast when the capacity is a small number, but the table has a column for every weight from 0 to the capacity, so a capacity of a billion makes it far too big, however few crates there are.

**Subset sums.** "Can some of these numbers add up to exactly t?" is the same table holding yes or no: `can[i][s]` is true when `can[i - 1][s]` is, or when `can[i - 1][s - x]` is for the new number x. To split a list into two groups with equal totals, ask whether some subset makes half the total. An odd total can't be split, which is a quick no before any table.

## Ranges built from smaller ranges

Some problems are about a stretch of a list, where the last step splits a range in two or joins two neighbouring ranges. The state is the range itself, from index i to index j.

A beam 10 metres long has marks at 2, 4, and 7, and each cut costs the length of the piece being cut. Cutting from left to right costs 10, then 8, then 6, for 24. Cutting at 4 first costs 10, then 4 for the left piece and 6 for the right, for 20. The order matters, so try every choice of first cut.

Put the ends of the beam and the marks in one sorted list of points: 0, 2, 4, 7, and 10. Let `cost[i][j]` be the cheapest way to make every cut strictly between point i and point j. The first cut in that piece is at some point k between them. It costs the piece's length, `points[j] - points[i]`, and leaves two smaller pieces, which cost `cost[i][k]` and `cost[k][j]`. Try every k and keep the cheapest.

Two points next to each other have no mark between them, so `cost[i][i + 1]` is 0. Each entry reads shorter ranges, so fill by length.

```ts
for (let length = 2; length < points.length; length++) {
  for (let i = 0; i + length < points.length; i++) {
    const j = i + length;
    let cheapest = Infinity;
    for (let k = i + 1; k < j; k++) {
      cheapest = Math.min(cheapest, cost[i][k] + cost[k][j]);
    }
    cost[i][j] = cheapest + points[j] - points[i];
  }
}
```

There are O(n²) ranges, and each tries up to n split points, so this is O(n³) time.

Joining things works the same way. If joining two neighbouring piles costs their combined size, the last join of piles i to j always costs the whole range's total, whatever came before. So `cost[i][j]` is that total plus the best `cost[i][k] + cost[k + 1][j]` over every split k. Prefix sums from the arrays and hashing chapter give each range's total in O(1).

These totals can get big. Return them in a 64-bit type, as `long` in Java and `long long` in C.

## Shrinking the table to one row

The grid, string, and knapsack recurrences above read only the current row and the row before it. So there's no need to keep every row. Two rows always work. Often one row is enough, if you're careful about which values are still the old ones.

**Grid paths in one row.** Keep `row[c]`, starting as a 1 followed by 0s, as if one path came into the start from above. Before the update it holds the paths into the cell above, and after it, the paths into this cell.

```ts
for (let c = 0; c < cols; c++) {
  if (wall[r][c]) row[c] = 0;
  else if (c > 0) row[c] += row[c - 1]; // above plus left
}
```

Going left to right is right here, because `row[c - 1]` should already be this row's value.

**Knapsack in one row.** The update is `best[w] = max(best[w], best[w - weight] + value)`, and here `best[w - weight]` must still be the old value, from before this crate. Going left to right breaks that. With a crate of weight 2 and value 3 and a capacity of 4, the loop sets `best[2]` to 3, then reads that new value for `best[4]` and sets it to 6, as if the crate went in twice. That's the unlimited coins count from the one dimensional chapter.

Running the inner loop backwards fixes it. Going from the capacity down to the crate's weight, the smaller entries a step reads haven't been touched yet, so they still hold the row before.

```ts
for (let i = 0; i < weights.length; i++) {
  for (let w = capacity; w >= weights[i]; w--) {
    best[w] = Math.max(best[w], best[w - weights[i]] + values[i]);
  }
}
```

**Two strings in one row.** The common subsequence and edit distance read the entry up and to the left, `[i - 1][j - 1]`, and updating `j - 1` overwrites it. Save it in a variable before you overwrite it, or keep two rows, which is just as small in big O terms and easier to get right.

Range tables don't shrink this way, since a range reads ranges of many lengths.

One row saves memory, not time. It also throws away the table you'd need to rebuild the actual path or subsequence. If the question asks for the path itself, keep the whole table and walk back from the answer.

Before you start, ask about the edges: an empty string, a grid of one cell, a start or end that's blocked, a capacity of 0, a total that's odd, and how big the answer can get.
