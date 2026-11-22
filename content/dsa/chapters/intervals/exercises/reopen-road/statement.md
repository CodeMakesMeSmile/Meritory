# Reopen part of the highway

A highway map lists its `closures`, each as `[from, to]` in kilometres along the road. A closure covers from `from` up to `to`. The list is sorted by `from`, and no two closures overlap or touch.

Road crews finish work on the stretch `reopened`, also as `[from, to]`, and every part of the road inside it opens. Parts of a closure outside that stretch stay closed, so a closure can shrink, split in two, or go away completely.

Return the closures that are left, sorted by `from`. A closure that only touches the reopened stretch, like `[2, 5]` next to a reopened `[5, 9]`, doesn't change. Leave out any piece with no length.

## Example

With `closures = [[0, 4], [6, 12], [15, 20]]` and `reopened = [3, 8]`, the first closure loses the part from 3 to 4, and the second loses the part from 6 to 8. The answer is `[[0, 3], [8, 12], [15, 20]]`.

## Limits

- From 0 to 10,000 closures.
- Every closure and the reopened stretch have `0 <= from < to <= 1,000,000`.
- Aim for O(n) time.
