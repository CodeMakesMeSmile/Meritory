# An even stretch

A team's season is a list of `games`, where `true` is a win and `false` is a loss. Return the number of games in the longest stretch of games in a row with as many wins as losses, or 0 if there's no such stretch.

## Example

With `games = [true, true, false, true, false, false, false]`, the first six games have three wins and three losses, so the answer is 6.

## Limits

- Up to 100,000 games.
- Aim for O(n) time.
