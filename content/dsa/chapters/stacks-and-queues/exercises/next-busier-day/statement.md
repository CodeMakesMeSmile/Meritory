# Days until a busier day

A museum counts its `visitors` each day. For each day, find how many days you'd wait until a day with strictly more visitors. If no later day is busier, use 0.

## Example

With `visitors = [120, 90, 95, 130, 80, 100]`, day 0 waits 3 days for 130, day 1 waits 1 day for 95, and day 2 waits 1 day for 130. Day 3 is never beaten, day 4 waits 1 day for 100, and day 5 is the last. The answer is `[3, 1, 1, 0, 1, 0]`.

## Limits

- Up to 100,000 days, each count between 0 and 1,000,000.
- Aim for O(n) time.
