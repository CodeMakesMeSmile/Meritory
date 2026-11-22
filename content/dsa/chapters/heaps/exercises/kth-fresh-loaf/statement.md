# The k-th loaf out of the ovens

A bakery has several ovens. For each oven, `ovens` lists the minutes after opening when its loaves come out, sorted from earliest to latest. An oven's list can be empty.

Counting every oven together, return the minute the k-th loaf of the day comes out, where `k = 1` is the first loaf. Loaves that come out at the same minute each count.

## Example

With `ovens = [[5, 20, 40], [10, 15], [12, 30, 45]]` and `k = 4`, the loaves come out at 5, 10, 12, 15, 20, 30, 40, and 45, so the answer is 15.

## Limits

- From 1 to 1,000 ovens, with 1 to 100,000 loaves in all, each at a minute between 0 and 1,000,000.
- `k` is between 1 and the number of loaves.
- Aim for O(m + k log m) time, where m is the number of ovens, without merging every list.
