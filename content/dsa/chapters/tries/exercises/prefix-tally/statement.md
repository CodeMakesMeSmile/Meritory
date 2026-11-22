# Tallying searches by how they start

A recipe site keeps a tally of the saved searches on its shared kitchen screen. The same search can be saved more than once, and each copy counts. People also delete saved searches, one copy at a time.

Build a `PrefixTally` that starts empty.

- `add(word)` saves one more copy of `word`.
- `remove(word)` deletes one copy of `word`. It's only called when at least one copy is saved.
- `countStarting(prefix)` returns how many saved copies start with `prefix`. A word counts as starting with itself.
- `countExact(word)` returns how many saved copies are exactly `word`.

## Example

After `add("soup")`, `add("soup")`, and `add("sourdough")`, `countStarting("sou")` returns 3 and `countExact("soup")` returns 2. After `remove("soup")`, `countStarting("sou")` returns 2 and `countExact("soup")` returns 1. `countExact("sou")` returns 0, since no saved search is exactly sou.

## Limits

- Every word and prefix has from 1 to 30 lowercase letters.
- Up to 10,000 calls in all.
- Aim for O(L) time per call, where L is the length of the word or prefix.
- The reference solution walks the trie in loops. A word has at most 30 letters, so a recursive walk would be safe too.
