# When the whole team is free

A team wants to find times to meet. Each row of `calendars` is one person's busy times, written as pairs in a single list, in minutes from midnight. So `[540, 600, 720, 780]` means busy from 540 up to 600 and from 720 up to 780. Each person's busy times are sorted and don't overlap. A row can be empty, for someone with nothing booked.

A busy time covers its start and runs up to its end. So when one person is busy until 600 and another is busy from 600, there's no free time between them.

Return every stretch inside the working day, from `dayStart` up to `dayEnd`, when nobody is busy, sorted by start. Busy times can start before the day or run past its end. A stretch has to have some length.

## Example

With `calendars = [[540, 600, 720, 780], [570, 630], [840, 900, 960, 1020]]`, `dayStart = 480`, and `dayEnd = 1020`, someone is busy from 540 to 630, from 720 to 780, from 840 to 900, and from 960 to 1020. The answer is the time around those: `[[480, 540], [630, 720], [780, 840], [900, 960]]`.

## Limits

- From 0 to 50 calendars, each with 0 to 1,000 busy times.
- Each busy time has `0 <= start < end <= 1,440`.
- `0 <= dayStart < dayEnd <= 1,440`.
- Aim for O(N log N) time, where N is the number of busy times in all.
