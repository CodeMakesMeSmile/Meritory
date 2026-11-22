from typing import Optional


class Solution:
    def coinRoute(self, rooms: Optional[TreeNode], target: int) -> bool:
        # Each call carries the gold gathered on the way down to this room
        def search(node: Optional[TreeNode], gathered: int) -> bool:
            if not node:
                return False
            total = gathered + node.val
            if not node.left and not node.right:
                return total == target
            return search(node.left, total) or search(node.right, total)

        return search(rooms, 0)
