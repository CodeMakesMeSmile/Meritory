# Days you're both free

Two friends each list the days of the year they're free, as `first` and `second`. Each list is sorted from earliest to latest, and a list can repeat a day. Return every day that's in both lists, once each, sorted from earliest to latest.

## Example

With `first = [2, 5, 5, 9, 14]` and `second = [1, 5, 9, 9, 20]`, the friends are both free on days 5 and 9, so the answer is `[5, 9]`.

## Limits

- Up to 100,000 days in each list, each between 1 and 366.
- Aim for O(n + m) time and O(1) extra memory besides the answer.
