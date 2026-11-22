# The cheapest parcel route with few stops

A courier has `n` depots, numbered from 0 to n - 1. Each `[from, to, price]` in `routes` means a van carries parcels from depot `from` to depot `to` for `price`. Routes only go one way.

A parcel goes from depot `source` to depot `target`. Every depot it passes through in between is a stop, and each stop risks a delay, so the parcel may make at most `maxStops` stops. Return the cheapest total price for the trip. If no trip with that few stops reaches `target`, return -1.

## Example

With `n = 4`, `routes = [[0, 1, 100], [1, 2, 100], [0, 2, 500], [2, 3, 100], [1, 3, 600]]`, `source = 0`, `target = 3`, and `maxStops = 1`, the trip through depot 2 costs 500 + 100 = 600 and the trip through depot 1 costs 100 + 600 = 700. The answer is 600. With `maxStops = 2`, the trip through depots 1 and 2 costs 300.

## Limits

- `n` is between 2 and 100, and there are up to 5,000 routes.
- Each price is between 1 and 10,000. Each route joins two different depots, and the same pair can be listed more than once.
- `source` and `target` are different, and `maxStops` is between 0 and n - 1.
- Aim for O(k × m) time, where k is `maxStops` and m is the number of routes.
