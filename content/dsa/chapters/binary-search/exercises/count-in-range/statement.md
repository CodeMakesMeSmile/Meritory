# Readings in a range

A weather station keeps a sorted list of every wind speed it has recorded, `readings`, from lowest to highest, with repeats. Given `low` and `high`, return how many readings are at least `low` and at most `high`. If `low` is more than `high`, return 0.

## Example

With `readings = [3, 7, 7, 10, 14, 14, 21]`, `low = 7`, and `high = 14`, the readings 7, 7, 10, 14, and 14 are in range, so the answer is 5.

## Limits

- Up to 100,000 readings, each between 0 and 1,000,000, sorted from lowest to highest.
- `low` and `high` are each between 0 and 1,000,000.
- Aim for O(log n) time.
