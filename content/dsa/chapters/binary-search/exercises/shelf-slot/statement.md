# Where the book goes

A library shelf holds books sorted by their catalogue number, `ids`, from lowest to highest. Some numbers repeat, since the library can own more than one copy of a book. Return the position where a new book numbered `newId` should go so the shelf stays sorted. If copies of it are already there, it goes in front of them.

## Example

With `ids = [3, 8, 8, 12, 20]` and `newId = 8`, the new copy goes in front of the other 8s, at position 1. With `newId = 15`, it goes at position 4, between 12 and 20.

## Limits

- Up to 100,000 books, each number between 1 and 1,000,000,000, sorted from lowest to highest.
- `newId` is between 1 and 1,000,000,000.
- Aim for O(log n) time.
