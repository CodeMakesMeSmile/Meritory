# The best stretch of the loop trail

A loop trail around a lake has lookout points in a ring, and after the last point the trail comes back to the first. A ranger scores each point's view in `views`, with a negative score where trees or fences block it.

A walker picks a stretch of one or more points in a row. The stretch can wrap past the last point to the first, but it can't include any point twice. Return the highest total score of any stretch.

## Example

With `views = [5, -3, -4, 6, 2]`, the stretch from the point scored 6, through 2, and round to 5 adds up to 13. The best stretch that doesn't wrap only reaches 8, so the answer is 13.

## Limits

- From 1 to 100,000 points.
- Each score is between -10,000 and 10,000, so every total fits in 32 bits.
- Aim for O(n) time and O(1) extra memory.
