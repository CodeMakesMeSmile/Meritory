# Next cheaper fill-up

A driver logs the price of fuel at the same station each day in `prices`. For each day, find the price on the first later day when fuel was strictly cheaper. If it never got cheaper after that day, use -1.

## Example

With `prices = [150, 162, 148, 155, 140]`, day 0's price of 150 is first beaten by 148 on day 2, and so is day 1's. Days 2 and 3 are first beaten by 140, and nothing comes after day 4. The answer is `[148, 148, 140, 140, -1]`.

## Limits

- Up to 100,000 days, each price between 1 and 1,000,000,000.
- Aim for O(n) time.
