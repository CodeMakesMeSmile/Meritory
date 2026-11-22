from typing import Optional


class Solution:
    def longestTrail(self, trails: Optional[TreeNode]) -> int:
        best = 0

        # Returns how many junctions deep this branch goes, and records the best bend on the way
        def depth(node: Optional[TreeNode]) -> int:
            nonlocal best
            if not node:
                return 0
            left = depth(node.left)
            right = depth(node.right)
            best = max(best, left + right)
            return 1 + max(left, right)

        depth(trails)
        return best
