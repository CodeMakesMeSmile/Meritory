# Exactly enough gold

A dungeon game's map is a binary tree of rooms, with `rooms` as the room where players start. Each room changes a player's gold: a positive number is treasure they pick up, and a negative number is a toll they pay. From each room, doors lead down to its left and right children. A room with no doors onward is a dead end, which ends the run.

Return `true` if some route from the start down to a dead end changes a player's gold by exactly `target`, and `false` otherwise. An empty map has no routes.

## Example

```text
[5, 3, 8, 2, null, 4, 1]

        5
       / \
      3   8
     /   / \
    2   4   1
```

With `target = 10`, the route 5, 3, 2 adds up to 10 and ends at a dead end, so the answer is `true`. With `target = 8`, the answer is `false`. The route 5, 3 adds up to 8, but room 3 isn't a dead end.

## Limits

- From 0 to 10,000 rooms, each changing the gold by between -1,000 and 1,000.
- `target` is between -1,000,000 and 1,000,000.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim for O(n) time.
