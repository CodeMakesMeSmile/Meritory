# A story on one line

A choose your own path app stores each story as a binary tree of scene numbers, with `story` as the opening scene. A scene's left child is where the first choice leads and its right child is where the second choice leads. A missing child means that choice isn't offered.

To send a story to a phone, the app writes the tree as one line of text. Write the scenes in preorder, each scene before the scenes its choices lead to, first choice before second. Write `#` for every missing child, and put a comma between every two parts.

Return the line of text. An empty story is just `#`.

## Example

```text
[1, 2, 3, null, null, 4, 5]

      1
     / \
    2   3
       / \
      4   5
```

This story is written as `"1,2,#,#,3,4,#,#,5,#,#"`. Scene 2 has no choices, so two markers follow it.

## Limits

- From 0 to 10,000 scenes, each numbered between -1,000 and 1,000. Numbers can repeat.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim for O(n) time.
