# The most searched words

A library's catalogue logs every word people search for in `searches`. Return the `k` words searched most often, most searched first. When two words were searched the same number of times, the one that comes first in the alphabet goes first.

## Example

With `searches = ["maps", "jazz", "maps", "baking", "jazz", "maps"]` and `k = 2`, "maps" was searched 3 times and "jazz" 2 times, so the answer is `["maps", "jazz"]`.

## Limits

- From 1 to 100,000 searches, each a word of 1 to 20 lowercase letters.
- `k` is between 1 and the number of different words.
- Aim for O(n + m log k) time, where m is the number of different words.
