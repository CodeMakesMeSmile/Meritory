# Biggest poster on the fence

A fence is a row of boards, each 1 unit wide, and `boards[i]` is the height of board `i`. You want to paste up one rectangular poster, flat against the fence, with its sides along the edges of the boards. The poster can't stick up past the top of any board it covers.

Return the largest area a poster can have.

## Example

With `boards = [3, 1, 4, 5, 3, 4]`, a poster 3 units tall can cover boards 2 to 5, for an area of 12. A poster 4 units tall only fits across boards 2 and 3, for 8. No poster is bigger than 12, so that's the answer.

## Limits

- From 1 to 100,000 boards, each between 0 and 10,000 units tall.
- Aim for O(n) time.
