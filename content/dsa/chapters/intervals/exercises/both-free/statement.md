# When both guides are free

Two tour guides each list the times they're free, `first` and `second`, as `[start, end]` in minutes from midnight. Each list is sorted by start, and within one list no two free times overlap or touch. A free time covers its start and runs up to its end, so a guide who's free until 600 is busy again at 600.

Return every stretch when both guides are free, sorted by start. A stretch has to have some length, so a free time that ends at 600 and one that starts at 600 share nothing.

## Example

With `first = [[480, 600], [660, 720], [780, 900]]` and `second = [[540, 690], [720, 840]]`, both guides are free from 540 to 600, from 660 to 690, and from 780 to 840. The second guide's time from 720 only touches the first guide's time that ends at 720, so it adds nothing there. The answer is `[[540, 600], [660, 690], [780, 840]]`.

## Limits

- From 0 to 10,000 free times in each list.
- Each free time has `0 <= start < end <= 1,440`.
- Aim for O(n + m) time.
