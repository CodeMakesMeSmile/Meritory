from typing import Optional


class Solution:
    def richestRoute(self, mine: Optional[TreeNode]) -> int:
        best = mine.val

        # Returns the best value of a route that starts here and only goes down
        def gain(node: Optional[TreeNode]) -> int:
            nonlocal best
            if not node:
                return 0
            # A side that only costs is better left off
            left = max(0, gain(node.left))
            right = max(0, gain(node.right))
            # A route that bends here can use both sides, but a parent can only extend one
            best = max(best, node.val + left + right)
            return node.val + max(left, right)

        gain(mine)
        return best
