# Print jobs taking turns

A shared office printer is fair to everyone. Jobs wait in a line in the order they arrived, and job `i` has `pages[i]` pages. On each turn, the printer takes the job at the front of the line and prints up to `k` of its pages. If the job still has pages left, it goes to the back of the line.

Return the job numbers in the order they finish.

## Example

With `pages = [5, 2, 7]` and `k = 3`, job 0 prints 3 pages and goes to the back with 2 left. Job 1 prints both its pages and finishes. Job 2 prints 3 and goes to the back with 4 left. Then job 0 finishes, and job 2 needs two more turns. The answer is `[1, 0, 2]`.

## Limits

- Up to 1,000 jobs, each from 1 to 1,000 pages.
- `k` is between 1 and 1,000.
- Aim for O(n + p / k) time, where p is the total number of pages.
