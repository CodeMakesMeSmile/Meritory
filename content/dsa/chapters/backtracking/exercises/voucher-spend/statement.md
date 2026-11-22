# Spend the voucher exactly

A gift voucher is worth `voucher`, and it can only be used if it's spent exactly. The shop has one of each item in `prices`, though several items can have the same price.

List every different basket whose prices add up to exactly `voucher`, using each item at most once. Two baskets are the same when they hold the same prices the same number of times. Write each basket's prices from lowest to highest, list each basket once, and return the baskets in any order. If no basket works, return an empty list.

## Example

With `prices = [4, 2, 6, 2, 3]` and `voucher = 8`, the baskets are `[2, 2, 4]` and `[2, 6]`. Either 2 can go with the 6, but `[2, 6]` is listed once.

## Limits

- From 1 to 30 items, each priced between 1 and 50.
- `voucher` is between 1 and 60.
- The cases are chosen so there are never more than 200 baskets.
- The recursion is at most 31 calls deep, so a recursive answer is safe in every language.
- Sort the prices first, so repeats sit together and the search can stop once a price is more than what's left to spend.
