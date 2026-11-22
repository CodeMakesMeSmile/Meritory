# The slowest pace that finishes

A student has `chapters` to read before an exam, with `chapters[i]` pages in chapter `i`, and `hours` hours left. They pick a pace, a whole number of pages per hour. Each hour, they read up to that many pages of one chapter. If they finish a chapter partway through an hour, they rest for the rest of that hour instead of starting the next one.

Return the slowest pace that finishes every chapter within `hours` hours.

## Example

With `chapters = [12, 30, 7, 18]` and `hours = 7`, a pace of 12 takes 1, 3, 1, and 2 hours, which is 7 in all. A pace of 11 would take 2, 3, 1, and 2, which is 8, so the answer is 12.

## Limits

- From 1 to 10,000 chapters, each from 1 to 1,000,000,000 pages.
- `hours` is between the number of chapters and 1,000,000,000.
- Aim for O(n log m) time, where m is the longest chapter.
