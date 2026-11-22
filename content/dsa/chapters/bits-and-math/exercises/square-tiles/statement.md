# Biggest square tile

A hall floor is `width` by `length` units. A tiler wants to cover it with square tiles that are all the same whole-number size, with no gaps and no cut tiles.

Return the side of the biggest square tile that does the job.

## Example

With `width = 12` and `length = 18`, tiles of side 6 fit 2 across and 3 along. Nothing bigger divides both sides, so the answer is 6.

## Limits

- `width` and `length` are each from 1 to 2,147,483,647.
- Trying every size from the smaller side down is far too slow at this size. Aim for O(log min(width, length)) steps.
