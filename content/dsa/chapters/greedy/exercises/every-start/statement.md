# Every depot the plough can start from

A snow plough salts a ring road with depots along it, numbered from 0, and after the last depot the road leads back to depot 0. Each of `depots` is `[load, spread]`. The plough loads `load` tonnes of salt at that depot, then spreads `spread` tonnes on the road to the next depot.

The plough starts empty and can carry any amount, but it can't run out of salt partway along a road. Finishing a road with exactly 0 left is fine. Return every depot it could start from and make the whole loop back to that depot, in increasing order.

## Example

With `depots = [[3, 1], [0, 2], [2, 1], [1, 2]]`, starting at depot 0 the plough holds 2, 0, 1, and then 0 tonnes after each road, so depot 0 works. Starting at depot 2 it holds 1, 0, 2, and then 0, so that works too. Depots 1 and 3 each spread more than they load on the very first road. The answer is `[0, 2]`.

## Limits

- From 1 to 100,000 depots.
- Each `load` and `spread` is between 0 and 10,000.
- Aim for O(n) time.
