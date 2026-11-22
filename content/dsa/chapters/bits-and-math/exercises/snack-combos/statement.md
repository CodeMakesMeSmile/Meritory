# Snacks that spend the voucher

A camp tuck shop has a few snacks, one of each, and `prices` lists what each one costs. A camper has a voucher worth exactly `budget` that only works if it's spent to the last cent.

Return how many different groups of one or more snacks cost exactly `budget` in total. Snacks are told apart by their position, so two snacks with the same price still make different groups.

## Example

With `prices = [2, 3, 5, 1]` and `budget = 6`, two groups work: the snacks costing 2, 3, and 1, and the snacks costing 5 and 1. The answer is 2.

## Limits

- From 0 to 15 snacks, each costing from 1 to 1,000,000.
- `budget` is from 1 to 15,000,000.
- With at most 15 snacks, there are at most 32,768 groups, so checking every one is fine. Use a bitmask for each group.
