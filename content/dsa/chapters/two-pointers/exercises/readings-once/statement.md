# Each reading once

A sensor keeps its `readings` in a fixed-size buffer, sorted from lowest to highest, and it sometimes records the same value more than once. Rearrange the buffer so each different value appears once at the front, still sorted. Then mark every slot after them as empty by setting it to -1.

Change `readings` in place and return nothing. The buffer is checked after your function runs.

## Example

`[2, 2, 5, 7, 7, 7]` becomes `[2, 5, 7, -1, -1, -1]`.

## Limits

- Up to 100,000 readings, each between 0 and 1,000,000,000, sorted from lowest to highest.
- Aim for O(n) time and O(1) extra memory.
