# Codes that shift together

A code is a string of lowercase letters. Shifting a code moves every letter the same number of places along the alphabet, with z wrapping around to a. So "abc" shifts to "bcd", and "az" shifts to "ba".

Given a list of `codes`, put codes that can be shifted into one another into one group.

Return the groups as a list of lists, in this order:

- Groups appear in the order of their first code in the input.
- Codes inside a group keep their order from the input.
- A code that appears more than once stays in its group each time.

## Example

`["abc", "bcd", "az", "ba", "xyz", "a", "z"]` becomes `[["abc", "bcd", "xyz"], ["az", "ba"], ["a", "z"]]`.

## Limits

- Up to 10,000 codes, each with from 1 to 50 letters.
