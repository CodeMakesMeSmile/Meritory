# Busy stretches at the sports hall

A sports hall takes `bookings`, each as `[start, end]` in minutes from midnight, in no particular order. A booking covers its start and runs up to its end. The front desk wants a short list of when the hall is busy.

Join bookings that overlap into one stretch. Bookings that only touch, like `[60, 120]` and `[120, 180]`, join too, since the hall is busy from 60 to 180 with no gap. Return the stretches sorted by start.

## Example

With `bookings = [[540, 600], [480, 550], [700, 760], [600, 630]]`, the bookings starting at 480 and 540 overlap, which makes `[480, 600]`. The booking `[600, 630]` touches that stretch, so it grows to `[480, 630]`. The answer is `[[480, 630], [700, 760]]`.

## Limits

- From 0 to 10,000 bookings.
- Each booking has `0 <= start < end <= 1,440`.
- Aim for O(n log n) time.
