# The shortest code for each bin

A workshop keeps parts in bins, one bin for each item in `items`, and labels every bin with a short code. A bin's code is the shortest start of its item's name that no other item's name starts with, so a worker can type the code and find exactly one bin.

Return the code for each item, in the same order as `items`.

## Example

With `items = ["bolt", "bracket", "brace", "nut", "nail"]`:

- bolt gets `bo`, since b is shared by three items but only bolt starts with bo.
- bracket gets `brack`, since brace also starts with brac.
- brace gets `brace`, the whole name, for the same reason.
- nut gets `nu`, and nail gets `na`.

The answer is `["bo", "brack", "brace", "nu", "na"]`.

## Limits

- From 1 to 1,000 items, each with from 1 to 50 lowercase letters.
- No item is listed twice, and no item's name is the start of another's, so every item has a code.
- With one item, its code is its first letter.
- Aim for O(total letters) time, with a count on each trie node.
- The reference solution walks the trie in loops. Words are short, so a recursive walk would be safe too.
