# Checking plays with blank tiles

A word tile game has blank tiles, which can stand for any letter. Before a play is accepted, the game checks whether the tiles laid down could spell a word in its dictionary. A play is written as a pattern of letters, with `.` for each blank tile.

Build a `TileDictionary` that starts empty.

- `add(word)` puts a word in the dictionary.
- `matches(pattern)` returns `true` if some word in the dictionary has the same length as `pattern` and the same letter in every place the pattern has a letter, and `false` if no word does. Each `.` matches any one letter.

## Example

After `add("cat")`, `add("cart")`, and `add("dog")`, `matches("c.t")` returns `true` for cat, `matches("ca..")` returns `true` for cart, `matches("...")` returns `true`, and `matches("c..")` also returns `true`. But `matches("d.")` returns `false`, since no two letter word starts with d, and `matches("ca")` returns `false`, since ca isn't a word.

## Limits

- Every word has from 1 to 20 lowercase letters, and every pattern has from 1 to 20 characters, each a lowercase letter or `.`.
- A pattern has at most 3 dots.
- Up to 10,000 calls in all.
- The reference solution searches recursively, one call per character of the pattern, so the recursion is at most 21 calls deep, which is safe in every language.
