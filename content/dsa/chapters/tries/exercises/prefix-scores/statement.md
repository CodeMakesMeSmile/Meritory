# Scoring words by the starts they share

In a party word game, every player writes down a word, and `words` holds them all. A word scores by how much it has in common with the round. For each prefix of the word, from its first letter up to the whole word, it gets one point for every word in the round that starts with that prefix, its own included.

Return each word's score, in the same order as `words`.

## Example

With `words = ["star", "stay", "sun", "moon"]`, star scores 3 for s, since three words start with s, then 2 for st, 2 for sta, and 1 for star, for 8. Stay also scores 8. Sun scores 3 + 1 + 1 = 5, and moon scores 1 for each of its four prefixes, for 4. The answer is `[8, 8, 5, 4]`.

## Limits

- From 1 to 1,000 words, each with from 1 to 100 lowercase letters.
- Two players can write the same word, and each copy counts as its own word.
- A score is at most 100,000, so it fits in 32 bits.
- Aim for O(total letters) time, with a count on each trie node.
- The reference solution walks the trie in loops. Words are short, so a recursive walk would be safe too.
