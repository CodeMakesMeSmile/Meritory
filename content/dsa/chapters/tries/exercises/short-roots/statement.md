# Cutting words down to their stems

A note-taking app builds its search index from stems, so that "walked", "walking", and "walks" all file under "walk". It has a list of `stems`. Each word in `sentence` that starts with one or more stems is cut down to the shortest of them. A word that starts with no stem stays as it is.

Return the sentence with every word cut down, keeping the words in order with single spaces between them.

## Example

With `stems = ["walk", "run", "wa"]` and `sentence = "walking runners wait here"`, walking becomes wa, since wa is shorter than walk, runners becomes run, wait becomes wa, and here has no stem. The answer is `"wa run wa here"`.

## Limits

- From 1 to 1,000 stems, each with from 1 to 100 lowercase letters.
- `sentence` has from 1 to 1,000 words, each with from 1 to 100 lowercase letters, with exactly one space between words and none at either end.
- A word counts as starting with itself, so a word that is a stem stays the same.
- Aim for O(total letters) time, stopping each word's walk at the first stem it reaches.
- The reference solution walks a trie in loops. A stem has at most 100 letters, so a recursive walk would be safe too.
