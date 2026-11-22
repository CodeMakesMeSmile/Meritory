# Bookings on one day

A climbing gym logs every class booking by its day number and keeps the list, `days`, sorted from lowest to highest. A busy day shows up many times. Return the first and last positions in the list that hold `day`, as `[first, last]`. If nothing is booked that day, return `[-1, -1]`.

## Example

With `days = [2, 5, 5, 5, 9, 12]` and `day = 5`, the bookings for day 5 run from position 1 to position 3, so the answer is `[1, 3]`. With `day = 6`, the answer is `[-1, -1]`.

## Limits

- Up to 100,000 bookings, each day number between 1 and 1,000,000,000, sorted from lowest to highest.
- `day` is between 1 and 1,000,000,000.
- Aim for O(log n) time, even when most bookings are on the same day.
