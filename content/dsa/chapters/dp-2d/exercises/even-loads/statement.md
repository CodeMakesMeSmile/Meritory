# Two equal loads

Two friends are moving house and carry a pile of parcels to the new place together. `parcels[i]` is the weight of parcel `i` in kilograms. Every parcel goes with one friend or the other, and a parcel can't be split.

Return `true` if the parcels can be shared so that both friends carry exactly the same total weight, and `false` if they can't.

## Example

With `parcels = [3, 8, 4, 5, 2]`, the total is 22, and 8 and 3 make 11, so the other friend carries 4, 5, and 2, which also make 11. The answer is `true`.

With `parcels = [6, 2, 3]`, the total is 11, which is odd, so the answer is `false`.

## Limits

- From 1 to 200 parcels, each weighing from 1 to 100 kilograms.
- Aim for O(n × total) time, using one row of yes or no answers for every weight up to half the total.
- The reference solution fills that row in loops, so it doesn't recurse.
