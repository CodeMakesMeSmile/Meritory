# Canoes for the camp trip

A summer camp is paddling everyone across a lake. Each canoe holds at most two campers, and the campers in one canoe can weigh at most `limit` kilograms together. `weights` lists each camper's weight, and no camper weighs more than `limit` on their own.

Return the fewest canoes that carry every camper.

## Example

With `weights = [70, 50, 80, 40, 60]` and `limit = 120`, the campers weighing 80 and 40 share a canoe, and so do the ones weighing 70 and 50. The camper weighing 60 goes alone. Five campers can't fit in two canoes, so the answer is 3.

## Limits

- From 1 to 100,000 campers.
- `1 <= weights[i] <= limit <= 30,000`.
- Aim for O(n log n) time.
