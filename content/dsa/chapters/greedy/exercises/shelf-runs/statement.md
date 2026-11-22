# The most runs to sort the shelf

A library shelf holds `books` numbered from 0 to n - 1, each exactly once, in a jumble. Volunteers will cut the shelf into runs of books that sit next to each other. Each volunteer sorts one run on their own, and the runs go back on the shelf in the same order as before.

Return the most runs the shelf can be cut into so that, once every run is sorted, the whole shelf is in order from 0 to n - 1.

## Example

With `books = [1, 0, 2, 4, 3]`, the runs `[1, 0]`, `[2]`, and `[4, 3]` each sort into place, giving `[0, 1, 2, 3, 4]`. Cutting `[1, 0]` apart would leave book 0 stuck after book 1, so the answer is 3.

## Limits

- From 1 to 100,000 books.
- `books` holds every number from 0 to n - 1 once.
- Aim for O(n) time and O(1) extra memory.
