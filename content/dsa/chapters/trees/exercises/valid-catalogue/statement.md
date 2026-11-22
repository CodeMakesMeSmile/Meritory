# Is the catalogue still in order?

A library finds books through an index of catalogue numbers kept as a binary search tree, with `index` as the root. The rule is that every number in a node's left branch is smaller than the node's number, and every number in its right branch is bigger. No number appears twice. After a bad import, some numbers may be in the wrong place.

Return `true` if the whole index still follows the rule, and `false` if any number breaks it. An empty index follows the rule.

## Example

```text
[8, 4, 12, 2, 9, 10, 14]

        8
       / \
      4   12
     / \  / \
    2  9 10  14
```

The answer is `false`. 9 is bigger than its parent 4, which is fine for a right child, but it's in the left branch of 8, so it should be smaller than 8.

## Limits

- From 0 to 10,000 numbers, each between -2,147,483,648 and 2,147,483,647, the full 32-bit range.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim for O(n) time.
