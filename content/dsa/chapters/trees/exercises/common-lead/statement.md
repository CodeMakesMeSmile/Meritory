# The closest shared lead

A volunteer group is organised as a binary tree of member numbers, with `team` as the coordinator at the top. Each member leads up to two others, their left and right children, and everyone below a member is in that member's group. A member is also in their own group. The numbers follow no order.

Return the number of the lowest member whose group holds both `a` and `b`. That's the closest lead the two of them share.

## Example

```text
[6, 9, 2, null, 4, 8, 1, 3, null, null, 5]

          6
        /   \
       9     2
        \   / \
         4 8   1
        /   \
       3     5
```

With `a = 8` and `b = 1`, the answer is 2. With `a = 2` and `b = 5`, the answer is also 2, since 5 is in 2's group and 2 is in their own.

## Limits

- From 1 to 10,000 members, each numbered between 1 and 1,000,000, all different.
- `a` and `b` are both in the tree, and they can be the same member.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim for O(n) time, visiting each member at most once.
