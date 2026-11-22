# Rebuild the pipe plan

A greenhouse waters its beds through pipes that split in two at each joint, so the joints form a binary tree. The drawing of the plan was lost, but two inspection logs survive. Each lists every joint number once. `preorder` lists them in preorder, each joint before its left branch and then its right branch. `inorder` lists them in inorder, the left branch, then the joint, then the right branch.

Rebuild the tree and return its root joint.

## Example

With `preorder = [8, 4, 2, 6, 12, 14]` and `inorder = [2, 4, 6, 8, 12, 14]`, the plan is:

```text
[8, 4, 12, 2, 6, null, 14]

        8
       / \
      4   12
     / \    \
    2   6    14
```

8 comes first in preorder, so it's the root. In inorder, 2, 4, and 6 come before 8, so they make up its left branch, and 12 and 14 make up its right.

## Limits

- From 0 to 10,000 joints, each numbered between -10,000 and 10,000, all different.
- Both lists hold the same numbers and come from one real tree.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim for O(n) time.
