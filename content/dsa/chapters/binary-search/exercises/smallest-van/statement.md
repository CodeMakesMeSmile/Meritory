# The smallest van that keeps up

A bakery sends out `parcels` in a fixed order, and `parcels[i]` is how heavy parcel `i` is. Each day, the van takes the next parcels in order, as many as fit without going over its capacity. Every parcel must go out within `days` days.

Return the smallest whole capacity that's enough.

## Example

With `parcels = [4, 8, 2, 6, 5, 3]` and `days = 3`, a capacity of 12 takes 4 and 8 on the first day, 2 and 6 on the second, and 5 and 3 on the third. A capacity of 11 would need 4 days, so the answer is 12.

## Limits

- From 1 to 50,000 parcels, each from 1 to 500.
- `days` is between 1 and the number of parcels.
- Aim for O(n log m) time, where m is the total weight.
