# Lanterns seen from the east

For a festival, numbered lanterns hang from a frame in levels, joined like a binary tree, with `lanterns` as the top lantern. Each lantern can have up to two lanterns hanging below it, to its left and right. Someone standing far off to the east, on the right of the frame, sees only the lantern furthest east on each level, since it hides the rest.

Return the numbers of the lanterns they can see, from the top level down. If there are no lanterns, return an empty list.

## Example

```text
[1, 2, 3, 4, 5, null, 6, 7]

          1
        /   \
       2     3
      / \     \
     4   5     6
    /
   7
```

From the east you see 1, 3, 6, and 7, so the answer is `[1, 3, 6, 7]`. Lantern 7 hangs on the far left, but nothing on its level is further east.

## Limits

- From 0 to 10,000 lanterns, each numbered between -1,000 and 1,000. Numbers can repeat.
- The tree is at most 500 levels deep. The reference solution walks it level by level with a queue, which doesn't depend on the depth.
- Aim for O(n) time.
