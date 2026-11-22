# Flagged words in a chat message

A school's chat app checks each message against a list of flagged `words` before it's sent. A word is in the message when its letters appear side by side somewhere in it, even inside a longer word, so "cheat" is in "cheater". Words never run across a space.

Return every flagged word that appears in `message`, each one once, in any order. If none appear, return an empty list.

## Example

With `message = "see you at the theatre"` and `words = ["the", "heat", "eat", "tea", "you"]`, the answer is `["you", "the", "heat", "eat"]` in any order. The appears twice, once on its own and once at the start of theatre, but it's listed once. Heat and eat are inside theatre too. Tea doesn't appear anywhere.

## Limits

- `message` has from 1 to 10,000 characters, each a lowercase letter or a space.
- From 1 to 500 words, each with from 1 to 20 lowercase letters, and no word listed twice.
- Aim for about O(n × L) steps, where L is the length of the longest word, by walking a trie from each position for as long as the letters match.
- The reference solution walks the trie in loops. Words are short, so a recursive walk would be safe too.
