# The cutoff for the final

A talent show sends its top `k` acts through to the final. Acts are scored one at a time, and after each new score the show announces the cutoff, which is the k-th highest score so far.

Build a `CutoffBoard` from `k` and the `scores` already given. Then `add(score)` records one more score and returns the cutoff. Equal scores each count, so with `k = 2` and two scores of 8, the cutoff is 8.

`scores` holds at least `k - 1` scores, so there are always at least k scores once `add` is called.

## Example

With `k = 3` and `scores = [40, 75, 60]`, `add(50)` returns 50, since the top three are now 75, 60, and 50. Then `add(90)` returns 60, `add(30)` returns 60, and `add(70)` returns 70.

## Limits

- `k` is between 1 and 10,000.
- `scores` holds up to 10,000 scores, and there are up to 10,000 calls to `add`.
- Each score is between -1,000,000,000 and 1,000,000,000.
- Aim for O(log k) time per `add`.
