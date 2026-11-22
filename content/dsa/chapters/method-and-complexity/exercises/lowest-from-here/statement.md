# Cheapest from here on

A bakery has the price of flour for each of the coming days in `prices`. A day is a safe day to buy when its price is strictly lower than the price on every day after it. The last day always counts, since no day comes after it.

Return the positions of the safe days, from first to last.

## Example

With `prices = [4, 2, 5, 3, 3, 6]`, the answer is `[1, 4, 5]`. Day 3 costs 3, but day 4 costs 3 too, so day 3 isn't strictly lower than every later day.

## Limits

- Up to 100,000 days, each price between -1,000,000,000 and 1,000,000,000. A negative price is a discount voucher.
- This is a warm-up for the method. Start by saying the brute force and its cost, then aim for O(n) time.
- Say what building the answer costs if you find the days from last to first.
