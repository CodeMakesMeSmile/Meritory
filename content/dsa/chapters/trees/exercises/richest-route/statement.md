# The richest route through the mine

An old mine's chambers form a binary tree, with `mine` as the chamber at the entrance. Each chamber has a value: ore worth something when it's positive, or the cost of shoring up the roof when it's negative. Tunnels only join each chamber to its parent and its children.

A route goes from one chamber to another through the tunnels, visiting no chamber twice. It can be a single chamber, and it doesn't have to pass the entrance. A route's value is the total of every chamber on it.

Return the highest value any route can have.

## Example

```text
[-20, 4, 30, null, null, 12, 9]

       -20
       /  \
      4    30
          /  \
        12    9
```

The route from 12 to 30 to 9 is worth 51. Going on to the entrance would cost 20, so the answer is 51.

## Limits

- From 1 to 10,000 chambers, each with a value between -1,000 and 1,000.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim for O(n) time, visiting each chamber once.
