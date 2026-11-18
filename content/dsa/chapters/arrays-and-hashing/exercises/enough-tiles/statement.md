# Enough tiles

A word game gives you a pile of letter `tiles`, written as a string with one letter for each tile. Return `true` if you can spell `word` from the pile, using each tile at most once, and `false` otherwise. Tiles left over are fine.

Both strings use only the lowercase letters a to z.

## Example

You can spell "pool" from the tiles "lopxo", so the answer is `true`. You can't spell it from "polx", which has only one o.

## Limits

- `word` and `tiles` each have from 0 to 100,000 letters.
- Aim for O(n) time.
