# The sign with no spaces

A sign painter ran short of room and left out every space, so the sign reads `text`. Given a list of `words`, check whether the sign can be split into words from the list, using any word as many times as needed and leaving no letters over.

Return `true` if it can be split, and `false` if it can't.

## Example

With `text = "teatimeisnow"` and `words = ["tea", "time", "is", "now", "teat", "i", "me"]`, the sign splits as tea, time, is, and now, so the answer is `true`. Starting with teat works too, as teat, i, me, is, and now.

## Limits

- `text` has from 1 to 300 lowercase letters.
- From 1 to 1,000 words, each with from 1 to 20 lowercase letters, and no word listed twice.
- Aim for about O(n × L) word lookups, where L is the length of the longest word, with the words in a set.
- The reference solution fills a table over the prefixes of `text`, so it doesn't recurse. Trying every first word without saving answers takes exponential time on some signs.
