# Charge to the last post

A delivery rider on an electric bike follows a row of charging posts, starting at post 0. A full charge at post `i` carries the bike up to `charge[i]` posts farther along, and the rider can stop to charge again at any post within that reach. A post with a `charge` of 0 is broken, so the bike can't go on from it.

Return whether the rider can reach the last post.

## Example

With `charge = [2, 0, 3, 0, 0, 1]`, the rider rides from post 0 to post 2, skipping the broken post 1. From post 2 the bike can go 3 posts farther, which reaches the last post, post 5. The answer is `true`.

With `charge = [1, 2, 0, 0, 3]`, the rider gets to post 1 and then as far as post 3, but posts 2 and 3 are both broken, so post 4 is out of reach. The answer is `false`.

## Limits

- From 1 to 100,000 posts.
- Each `charge` is between 0 and 100,000.
- Aim for O(n) time and O(1) extra memory.
