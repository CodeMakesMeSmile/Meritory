# Suggestions with every letter typed

A hardware shop's search box suggests products as a customer types. After each letter, it shows up to `k` product names that start with everything typed so far, in alphabetical order. If fewer than `k` names match, it shows all of them, and if none match, it shows nothing.

Given the shop's `products` and the letters the customer `typed`, return one list of suggestions for each letter typed, in order.

## Example

With `products = ["hammer", "hinge", "hook", "hose", "hacksaw"]`, `typed = "hos"`, and `k = 2`:

- After h, all five names match, and the first two in alphabetical order are hacksaw and hammer.
- After ho, hook and hose match.
- After hos, only hose matches.

The answer is `[["hacksaw", "hammer"], ["hook", "hose"], ["hose"]]`.

## Limits

- From 1 to 1,000 products, each with from 1 to 30 lowercase letters, and no name listed twice.
- `typed` has from 1 to 30 lowercase letters, and `k` is from 1 to 10.
- Aim to walk one step down the trie per letter typed, then collect at most `k` names from that node.
- The reference solution collects names with a recursive walk, which goes at most 31 calls deep, so it's safe in every language.
