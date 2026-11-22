# Where two parcel routes split

A courier's sorting hubs are arranged as a binary search tree of hub numbers, with `hubs` as the main hub. Every hub in a hub's left branch has a lower number, and every hub in its right branch has a higher one. A parcel for any hub starts at the main hub and travels down the tree to it.

Two parcels are headed for hubs `a` and `b`. Return the number of the lowest hub that both parcels pass through, which is where their routes split. A parcel passes through the hub it's headed for, so if one hub is on the way to the other, that hub is the answer.

## Example

```text
[40, 20, 60, 10, 30, 50, 70]

        40
       /  \
     20    60
    /  \   / \
   10  30 50  70
```

Parcels for 10 and 30 both pass through 40 and 20, then split, so the answer is 20. Parcels for 10 and 70 split right at the main hub, so the answer is 40.

## Limits

- From 1 to 10,000 hubs, each numbered between 1 and 1,000,000, all different.
- `a` and `b` are both hubs in the tree, and they can be the same hub.
- The reference solution walks down with a loop, so the depth doesn't matter.
- Aim for O(h) time, where h is the height of the tree, and O(1) extra memory.
