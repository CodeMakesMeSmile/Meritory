from typing import Optional


class Solution:
    def rebuildTree(self, preorder: list[int], inorder: list[int]) -> Optional[TreeNode]:
        where = {value: i for i, value in enumerate(inorder)}
        next_at = 0

        # Builds the subtree whose joints sit in inorder from lo up to but not including hi
        def build(lo: int, hi: int) -> Optional[TreeNode]:
            nonlocal next_at
            if lo >= hi:
                return None
            value = preorder[next_at]
            next_at += 1
            at = where[value]
            node = TreeNode(value)
            # Preorder lists the whole left branch before the right, so build the left first
            node.left = build(lo, at)
            node.right = build(at + 1, hi)
            return node

        return build(0, len(inorder))
