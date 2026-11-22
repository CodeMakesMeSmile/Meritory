# Three sizes of parcel

A sorting belt carries `parcels`, each marked by its size: 0 for small, 1 for medium, and 2 for large. Rearrange the list so every small parcel comes first, then every medium one, then every large one.

Change `parcels` in place and return nothing. The list is checked after your function runs. Try to do it in a single pass, without counting the sizes first.

## Example

`[2, 0, 1, 2, 0]` becomes `[0, 0, 1, 2, 2]`.

## Limits

- Up to 100,000 parcels, each 0, 1, or 2.
- Aim for one pass, O(n) time, and O(1) extra memory.
