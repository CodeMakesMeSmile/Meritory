from typing import Optional


class Solution:
    def countLookouts(self, stations: Optional[TreeNode]) -> int:
        # Each call carries the highest station on the way down from the base
        def count(node: Optional[TreeNode], highest: int) -> int:
            if not node:
                return 0
            clear = 1 if node.val >= highest else 0
            higher = max(highest, node.val)
            return clear + count(node.left, higher) + count(node.right, higher)

        return count(stations, stations.val) if stations else 0
