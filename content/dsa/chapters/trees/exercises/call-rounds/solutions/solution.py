from collections import deque
from typing import Optional


class Solution:
    def callRounds(self, tree: Optional[TreeNode]) -> list[list[int]]:
        rounds = []
        queue = deque([tree] if tree else [])
        while queue:
            # The queue holds exactly one round right now
            size = len(queue)
            this_round = []
            for _ in range(size):
                node = queue.popleft()
                this_round.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            rounds.append(this_round)
        return rounds
