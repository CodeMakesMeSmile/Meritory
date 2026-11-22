# Fit a new lesson into the diary

A piano teacher's `diary` lists their busy times as `[start, end]`, in minutes from midnight. The list is sorted by start, and no two busy times overlap or touch. A busy time covers its start and runs up to its end.

A new `booking` arrives as `[start, end]`. Add it to the diary, joining it with every busy time it overlaps or touches, and return the new diary, still sorted. A busy time that ends at 600 touches a booking that starts at 600, so they join into one.

## Example

With `diary = [[540, 570], [600, 660], [720, 750], [800, 830]]` and `booking = [650, 720]`, the booking overlaps `[600, 660]` and touches `[720, 750]`, so all three become `[600, 750]`. The answer is `[[540, 570], [600, 750], [800, 830]]`.

## Limits

- From 0 to 10,000 busy times.
- Every busy time and the booking have `0 <= start < end <= 1,440`.
- Aim for O(n) time. The diary is already sorted, so there's no need to sort it again.
