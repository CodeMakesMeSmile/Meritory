# Ways to make the change

A till has coins in the values listed in `coins`, with no value listed twice, and as many of each as it needs. Count the different sets of coins that add up to exactly `amount`. Order doesn't matter, so a 1 and a 2 is the same set as a 2 and a 1.

Return the count modulo 1,000,000,007.

## Example

With `coins = [1, 2, 5]` and `amount = 5`, there are 4 sets: one 5, two 2s and a 1, one 2 and three 1s, and five 1s.

## Limits

- From 1 to 50 coin values, each from 1 to 5,000, and no two the same.
- `amount` is from 0 to 5,000. An amount of 0 has exactly one set, the one with no coins.
- Aim for O(amount × c) time, where c is the number of coin values.
- The reference solution fills a table in two loops, so it doesn't recurse.
- Take the modulo after every addition, and add in a 64-bit type in Java and C.
