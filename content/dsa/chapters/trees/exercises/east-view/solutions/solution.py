from collections import deque
from typing import Optional


class Solution:
    def seenFromEast(self, lanterns: Optional[TreeNode]) -> list[int]:
        seen = []
        queue = deque([lanterns] if lanterns else [])
        while queue:
            # The queue holds exactly one level right now
            size = len(queue)
            for i in range(size):
                node = queue.popleft()
                # The last lantern taken from a level is the one furthest east
                if i == size - 1:
                    seen.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
        return seen
