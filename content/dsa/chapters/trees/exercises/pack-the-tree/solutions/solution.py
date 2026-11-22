from typing import Optional


class Solution:
    def packTree(self, story: Optional[TreeNode]) -> str:
        parts = []

        def write(node: Optional[TreeNode]) -> None:
            # A marker for each missing child shows where a branch ends
            if not node:
                parts.append("#")
                return
            parts.append(str(node.val))
            write(node.left)
            write(node.right)

        write(story)
        return ",".join(parts)
