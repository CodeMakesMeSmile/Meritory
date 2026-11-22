# Trimming two drafts to match

Two editors each wrote a draft of the same short headline, `first` and `second`, as strings of letters with no spaces. To agree on one version, they delete letters from either draft, any number from each, until both drafts read exactly the same. They can't add or change a letter, only delete.

Return the fewest letters they must delete in total. If both drafts end up empty, that counts as reading the same.

## Example

With `first = "sunrise"` and `second = "sunlit"`, deleting r, s, and e from the first leaves `suni`, and deleting l and t from the second leaves `suni` too. That's 5 deletes, and no way takes fewer, so the answer is 5.

## Limits

- Each draft has from 1 to 1,000 lowercase letters.
- Aim for O(n × m) time and O(m) memory, where n and m are the lengths of the drafts.
- The reference solution keeps one row of the table and the entry up and to the left in a variable, in a loop, so it doesn't recurse.
