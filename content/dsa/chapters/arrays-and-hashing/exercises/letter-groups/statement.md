# Groups of the same letters

Given a list of `words` made of the lowercase letters a to z, put words that use the same letters the same number of times into one group.

Return the groups as a list of lists, in this order:

- Groups appear in the order of their first word in the input.
- Words inside a group keep their order from the input.
- A word that appears more than once stays in its group each time.

## Example

`["tea", "ate", "tan", "eat", "nat", "bat"]` becomes `[["tea", "ate", "eat"], ["tan", "nat"], ["bat"]]`.

## Limits

- Up to 10,000 words, each with from 0 to 100 letters.
