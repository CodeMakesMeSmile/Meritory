# How many words fit the half-filled answer

A crossword solver keeps a list of `words`. For each half-filled answer in the grid, it shows how many words from the list could go there. Each answer in `patterns` is written with its known letters in place and a `.` for each empty square.

A word fits a pattern when it has the same length and the same letter in every place the pattern has a letter. Return a list with the number of words that fit each pattern, in the same order as `patterns`.

## Example

With `words = ["bat", "bit", "bot", "bait", "cat"]` and `patterns = ["b.t", ".at", "...", "b..t", "c"]`, the counts are 3 for bat, bit, and bot, then 2 for bat and cat, then 4 for every three letter word, then 1 for bait, and 0, since no word is just c. The answer is `[3, 2, 4, 1, 0]`.

## Limits

- From 1 to 5,000 words, each with from 1 to 10 lowercase letters, and no word listed twice.
- From 1 to 1,000 patterns, each with from 1 to 10 characters, each a lowercase letter or `.`.
- A pattern's search only follows trie paths that exist, so even a pattern of all dots visits each trie node at most once.
- The reference solution searches recursively, one call per character of the pattern, so the recursion is at most 11 calls deep, which is safe in every language.
