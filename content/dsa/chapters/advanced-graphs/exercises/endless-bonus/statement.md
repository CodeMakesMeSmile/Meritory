# A loop of doors that pays forever

A puzzle game has `n` rooms, numbered from 0 to n - 1. Each `[from, to, toll]` in `doors` is a one way door from room `from` to room `to`. Walking through it costs `toll` coins, and a negative toll pays the player that many coins instead. A door can lead from a room back into the same room.

The player starts in room `start`. Return `true` if they can reach a loop of doors whose tolls add up to less than zero, so going round it again and again pays them forever. A loop that adds up to exactly zero doesn't count. Return `false` otherwise.

## Example

With `n = 4`, `doors = [[0, 1, 3], [1, 2, -2], [2, 1, -2], [2, 3, 5]]`, and `start = 0`, the player walks into room 1, then goes back and forth between rooms 1 and 2. Each trip round pays 4 coins, so the answer is `true`.

## Limits

- `n` is between 1 and 500, and there are up to 5,000 doors.
- Each toll is between -1,000 and 1,000, and the same pair of rooms can have more than one door.
- Aim for O(n × m) time, where m is the number of doors.
