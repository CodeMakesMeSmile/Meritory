# Phone tree rounds

When the school closes for snow, a phone tree spreads the news. The organiser, at the root of `tree`, calls up to two parents, and each parent who gets a call then calls up to two more, their left and right children. All the calls at the same depth happen in the same round.

Return the parents' numbers round by round, starting with the organiser alone. Within a round, list them from left to right as they sit in the tree. If there's nobody in the tree, return an empty list.

## Example

```text
[1, 2, 3, 4, null, 5, 6]

        1
       / \
      2   3
     /   / \
    4   5   6
```

The rounds are `[[1], [2, 3], [4, 5, 6]]`.

## Limits

- From 0 to 10,000 parents, each numbered between -1,000 and 1,000. Numbers can repeat.
- The tree is at most 500 levels deep. The reference solution walks it level by level with a queue, which doesn't depend on the depth.
- Aim for O(n) time.
