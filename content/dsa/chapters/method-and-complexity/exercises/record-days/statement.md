# Record highs

A weather station logs the high temperature for each day in `highs`. A day sets a record when its high is strictly above the high of every day before it. The first day always sets one, since nothing came before it.

Return the positions of the record days, from first to last.

## Example

With `highs = [12, 15, 15, 9, 18, 17]`, the answer is `[0, 1, 4]`. Day 2 only ties the record of 15, so it doesn't set a new one.

## Limits

- Up to 100,000 days, each high between -1,000,000,000 and 1,000,000,000.
- This is a warm-up for the method. Start by saying the brute force and its cost, then aim for O(n) time.
- Say what adding each position to the answer costs, and why.
