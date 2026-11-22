# At most k kinds of jar

A shelf holds a row of `jars`, each labelled with a number for its kind of jam. You may take one stretch of jars in a row, but your crate has dividers for only `k` different kinds. Return the most jars you can take.

## Example

With `jars = [1, 2, 1, 3, 3, 2, 2]` and `k = 2`, the stretch `[3, 3, 2, 2]` holds two kinds, and no longer stretch holds two or fewer, so the answer is 4.

## Limits

- Up to 100,000 jars, each kind a number between 1 and 100,000.
- `k` is between 0 and 100,000.
- Aim for O(n) time.
