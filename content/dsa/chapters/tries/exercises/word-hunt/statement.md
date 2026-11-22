# Every listed word in the letter grid

A newspaper's puzzle page prints a grid of letters, and each string in `grid` is one row. A word is traced by starting on any cell that holds its first letter, then stepping up, down, left, or right to a cell that holds the next letter, and so on. Diagonal steps aren't allowed, and one word can't use the same cell twice.

The puzzle setter has a list of `words` and wants to know which of them can be traced. Return every word from the list that can be traced in the grid, each one once, in any order.

## Example

```text
c a t
o r s
w e n
```

With `grid = ["cat", "ors", "wen"]` and `words = ["cat", "cart", "cow", "crow", "rat", "star", "news", "bat"]`:

- cat runs along the top row, and cow runs down the left column.
- rat goes up from r to a, then right to t.
- star goes up from s to t, left to a, then down to r.
- cart can't be traced, because after c, a, and r, no t sits next to the r.
- crow, news, and bat can't be traced either.

The answer is `["cat", "cow", "rat", "star"]`, in any order.

## Limits

- From 1 to 8 rows, all the same length, with from 1 to 8 letters each.
- From 1 to 1,000 words, each with from 1 to 10 lowercase letters, and no word listed twice. Every letter in the grid is lowercase too.
- Put the words in a trie and walk it alongside the grid, so a path stops as soon as no word starts with its letters.
- The reference solution searches recursively, at most 10 calls deep, one for each letter of the longest word, which is safe in every language.
