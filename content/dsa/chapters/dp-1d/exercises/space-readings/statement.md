# Every way to read the note

A note was written in a hurry with no spaces, so it reads `text`. Given a list of `words`, count the different ways to split the note into words from the list, using any word as many times as needed and leaving no letters over. Two ways are different when they cut the note in different places.

Return the count modulo 1,000,000,007. If the note can't be split, return 0.

## Example

With `text = "icecreamcone"` and `words = ["ice", "cream", "icecream", "cone", "creamcone", "i", "ce"]`, there are 5 ways: ice cream cone, icecream cone, ice creamcone, i ce cream cone, and i ce creamcone.

## Limits

- `text` has from 1 to 1,000 lowercase letters.
- From 1 to 1,000 words, each with from 1 to 20 lowercase letters, and no word listed twice.
- Aim for about O(n × L) word lookups, where L is the length of the longest word, with the words in a set.
- The reference solution fills a table over the prefixes of `text`, so it doesn't recurse.
- Take the modulo after every addition, and add in a 64-bit type in Java and C.
