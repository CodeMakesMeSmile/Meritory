# Longest run of days

A habit tracker stores the `days` a habit was done as day numbers, in no particular order and sometimes repeated. Return the length of the longest run of consecutive day numbers, like 4, 5, 6, and 7. Return 0 if there are no days.

## Example

With `days = [100, 4, 200, 1, 3, 2]`, the longest run is 1, 2, 3, and 4, so the answer is 4.

## Limits

- Up to 100,000 days, each between -1,000,000,000 and 1,000,000,000.
- Aim for O(n) time, without sorting.
