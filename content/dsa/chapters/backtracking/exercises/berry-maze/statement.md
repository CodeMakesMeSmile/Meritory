# The best berry picking walk

A hedge maze has berry bushes in some of its squares. `field[r][c]` is how many berries the bush in row `r` and column `c` holds, or 0 where there's a hedge and no bush.

A picker starts at any bush, then steps up, down, left, or right to another bush, picking every bush they stand on. They can't walk through a hedge, leave the field, or come back to a bush they've already picked, and they can stop whenever they like. Return the most berries one walk can pick. If there are no bushes, return 0.

## Example

```text
4 0 2
3 0 9
5 1 6
```

Starting at the 4, the walk goes down to 3 and 5, across to 1 and 6, then up to 9 and 2. It picks every bush, for 30 berries.

## Limits

- From 1 to 15 rows and from 1 to 15 columns, with from 0 to 100 berries in each square.
- At most 25 squares have bushes, so the recursion is at most 26 calls deep, which is safe in every language.
- Try every bush as a start, mark each bush while it's on the walk, and clear the mark on the way back.
