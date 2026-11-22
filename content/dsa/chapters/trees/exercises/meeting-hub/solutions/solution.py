from typing import Optional


class Solution:
    def meetingHub(self, hubs: Optional[TreeNode], a: int, b: int) -> int:
        node = hubs
        while node:
            # Both routes go the same way from here, so the split is further down
            if a < node.val and b < node.val:
                node = node.left
            elif a > node.val and b > node.val:
                node = node.right
            else:
                return node.val
        return -1
