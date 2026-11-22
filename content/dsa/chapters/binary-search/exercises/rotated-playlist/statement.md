# A track in a looped playlist

A radio station plays a loop of tracks, each with a different number, sorted from lowest to highest. Today the loop started partway through. So `tracks` rises to the highest number, starts again from the lowest, and rises to just below where it began. It might also start at the lowest number and not wrap at all.

Return the position of track `target`, or -1 if it isn't in the loop.

## Example

With `tracks = [40, 50, 60, 10, 20, 30]` and `target = 20`, the answer is 4. With `target = 45`, the answer is -1.

## Limits

- From 1 to 100,000 tracks, all different, each between 1 and 1,000,000,000.
- `target` is between 1 and 1,000,000,000.
- Aim for O(log n) time.
