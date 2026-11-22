# How far a typo is from the word

A spell checker ranks its suggestions by how close each one is to what was typed. One edit adds a letter anywhere, removes a letter, or changes one letter into another.

Return the fewest edits that turn `typed` into `word`.

## Example

With `typed = "recieve"` and `word = "receive"`, the answer is 2: change the i to an e and the e after it to an i. With `typed = "hapy"` and `word = "happy"`, the answer is 1, adding a p.

## Limits

- `typed` and `word` each have from 0 to 500 lowercase letters. Either one can be empty.
- Aim for O(n × m) time, where n and m are the lengths of the two strings.
- The reference solution fills a table row by row, so it doesn't recurse.
