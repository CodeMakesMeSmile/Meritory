# When every relay hears the alert

A flood warning network has `n` relays, numbered from 0 to n - 1. Each `[from, to, delay]` in `links` means relay `from` passes an alert on to relay `to`, and it arrives `delay` milliseconds later. Links only go one way, so `to` doesn't pass anything back unless the list says so too.

An alert starts at relay `start` at time 0, and every relay passes it on along all of its links the moment it arrives. Return how many milliseconds it takes until every relay has the alert. If some relay never gets it, return -1.

## Example

With `n = 4`, `links = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1]]`, and `start = 0`, relay 2 hears at 1 ms. Relay 1 hears at 3 ms through relay 2, which beats its direct link at 4 ms. Relay 3 hears at 4 ms through relay 1. The answer is 4.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 links.
- Each delay is between 1 and 1,000. Each link joins two different relays, and the same pair can be listed more than once with different delays.
- Aim for O((n + m) log m) time, where m is the number of links.
