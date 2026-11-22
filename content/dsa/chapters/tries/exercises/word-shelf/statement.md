# A word list for the crossword helper

A crossword helper keeps a growing list of words, and as you fill in a clue it checks two things: whether what you've written is a word in the list, and whether any word in the list starts with it.

Build a `WordShelf` that starts empty.

- `add(word)` puts a word in the list. Adding a word that's already there changes nothing.
- `has(word)` returns `true` if that exact word was added, and `false` if it wasn't.
- `hasPrefix(prefix)` returns `true` if some added word starts with `prefix`, and `false` if none does. A word counts as starting with itself.

## Example

After `add("planet")` and `add("plan")`, `has("plan")` returns `true`, `has("plane")` returns `false`, and `hasPrefix("plane")` returns `true`, since planet starts with plane.

## Limits

- Every word and prefix has from 1 to 30 lowercase letters.
- Up to 10,000 calls in all.
- Aim for O(L) time per call, where L is the length of the word or prefix, however many words are in the list.
- The reference solution walks the trie in loops. A word has at most 30 letters, so a recursive walk would be safe too.
