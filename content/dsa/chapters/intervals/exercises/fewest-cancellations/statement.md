# Cancel the fewest talks

A small conference has one stage and a list of `talks`, each as `[start, end]` in minutes. Two talks clash when they'd be on the stage at the same time. A talk that ends at a minute leaves the stage free for one that starts at that minute, so `[60, 90]` and `[90, 120]` don't clash.

The organisers will cancel some talks so that none of the rest clash. Return the fewest talks they need to cancel.

## Example

With `talks = [[0, 30], [10, 20], [20, 40], [30, 50]]`, keeping `[10, 20]` and `[20, 40]` works, and there's no way to keep three talks without a clash. So the answer is 2.

## Limits

- From 0 to 10,000 talks.
- Each talk has `0 <= start < end <= 100,000`.
- Aim for O(n log n) time.
