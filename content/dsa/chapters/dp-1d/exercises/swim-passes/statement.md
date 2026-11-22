# The cheapest swim passes

A swimmer has planned which days of the year they'll go to the pool, and `days` lists them from first to last, numbered from 1 to 365. The pool sells three passes: a day pass for `prices[0]`, a week pass for `prices[1]`, and a month pass for `prices[2]`. A pass bought for day d covers 1, 7, or 30 days in a row, starting on day d.

Return the least the swimmer can spend so that every planned day is covered.

## Example

With `days = [1, 3, 4, 8, 9, 10, 20]` and `prices = [3, 10, 30]`, a week pass from day 3 to day 9 covers days 3, 4, 8, and 9 for 10. Day passes for days 1, 10, and 20 cost 9 more, for 19 in all.

## Limits

- From 1 to 365 planned days, each from 1 to 365, in increasing order with no repeats.
- Each price is from 1 to 1,000. A longer pass isn't always dearer, so compare all three.
- A pass can run past the end of the year.
- Aim for O(d) time, where d is the last planned day. The reference solution fills a table over the days of the year, so it doesn't recurse.
