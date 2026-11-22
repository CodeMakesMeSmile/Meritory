# Contacts that start with what you typed

A phone's contacts app shows suggestions as you type a name. Given the contact `names`, return up to `k` of them that start with `prefix`, in alphabetical order. If fewer than `k` names match, return all of them, and if none match, return an empty list. A name counts as starting with itself.

## Example

With `names = ["sam", "sasha", "ali", "sana", "samir", "bo"]`, `prefix = "sa"`, and `k = 3`, the names that start with sa are sam, samir, sana, and sasha in alphabetical order, so the answer is `["sam", "samir", "sana"]`.

## Limits

- From 1 to 10,000 names, each with from 1 to 20 lowercase letters, and no name listed twice.
- `prefix` has from 1 to 20 lowercase letters, and `k` is from 1 to 20.
- The names are given once and never change, so a sorted list with a binary search works as well as a trie. Either way, aim to read only the matching names, not the whole list, once it's built.
- The reference solution sorts the names and binary searches for the first match, so it doesn't recurse.
