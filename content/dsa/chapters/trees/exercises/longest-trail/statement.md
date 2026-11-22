# The longest walk in the park

A park's trail map is a binary tree of junctions, with `trails` as the junction at the entrance. From each junction, up to two trails lead further in, to its left and right children. Every trail between two junctions is one segment long.

A walk goes from one junction to another along the trails without going over any segment twice. Return the number of segments in the longest walk in the park. It doesn't have to start or end at the entrance.

## Example

```text
[1, 2, 3, 4, 5]

        1
       / \
      2   3
     / \
    4   5
```

The walk from 4 to 2 to 1 to 3 is 3 segments long, and no walk is longer, so the answer is 3.

## Limits

- From 1 to 10,000 junctions, each numbered between -1,000 and 1,000. The numbers don't affect the answer.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim for O(n) time, visiting each junction once.
