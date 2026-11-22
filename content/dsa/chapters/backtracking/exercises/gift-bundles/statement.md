# Gift bundles without repeats

A shop makes gift bundles from the items on one shelf, and `prices` lists each item's price. Some items cost the same, and a customer only sees prices, so two bundles are the same when they hold the same prices the same number of times.

List every different bundle the shelf can make, from the empty bundle to the whole shelf. Write each bundle's prices from lowest to highest, list each bundle once, and return the bundles in any order.

## Example

With `prices = [2, 5, 2]`, the bundles are `[]`, `[2]`, `[2, 2]`, `[2, 2, 5]`, `[2, 5]`, and `[5]`. Either 2 can go with the 5, but `[2, 5]` is listed once.

## Limits

- From 0 to 10 items, each priced between 1 and 100. With no items, the only bundle is the empty one.
- The recursion is at most 11 calls deep, so a recursive answer is safe in every language.
- Aim for O(n × 2ⁿ) time, and build each bundle only once rather than removing repeats at the end.
