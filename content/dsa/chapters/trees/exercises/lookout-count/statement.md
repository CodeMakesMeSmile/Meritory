# Stations with a view

A ski area's lifts branch out from the base, so its stations form a binary tree, with `stations` as the base station. Each node holds a station's height in metres. A station has a clear view if it's at least as high as every station on the way to it from the base. The base station always has a clear view.

Return how many stations have a clear view.

## Example

```text
[5, 3, 8, 6, 1, 7, 9]

        5
       / \
      3   8
     / \ / \
    6  1 7  9
```

5, 8, 6, and 9 have a clear view, so the answer is 4. Station 6 is lower than 8, but 8 isn't on its way from the base. Station 7 is blocked by 8.

## Limits

- From 1 to 10,000 stations, each between -1,000 and 10,000 metres high.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim for O(n) time.
