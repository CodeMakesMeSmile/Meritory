# Stamps for the postage

A post office sells stamps in the values listed in `values`, with no value listed twice, and it has as many of each as you like. A parcel needs stamps worth exactly `postage`.

List every different set of stamps that adds up to exactly `postage`. A set can use the same value as many times as it needs. Write each set's values from lowest to highest, list each set once, and return the sets in any order. If no set works, return an empty list.

## Example

With `values = [2, 3, 5]` and `postage = 8`, the sets are `[2, 2, 2, 2]`, `[2, 3, 3]`, and `[3, 5]`.

## Limits

- From 1 to 20 values, each between 1 and 50, and no two the same.
- `postage` is between 1 and 50.
- The cases are chosen so there are never more than 200 sets.
- The recursion is at most 51 calls deep, one per stamp, so a recursive answer is safe in every language.
- Sort the values, so a search can stop as soon as a stamp is worth more than what's still needed.
