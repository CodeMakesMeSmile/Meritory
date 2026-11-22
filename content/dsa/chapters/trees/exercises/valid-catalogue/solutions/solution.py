from typing import Optional


# Every number in this branch must be strictly between low and high, where None means no limit
def valid(node: Optional[TreeNode], low: Optional[int], high: Optional[int]) -> bool:
    if not node:
        return True
    if low is not None and node.val <= low:
        return False
    if high is not None and node.val >= high:
        return False
    return valid(node.left, low, node.val) and valid(node.right, node.val, high)


class Solution:
    def isSearchTree(self, index: Optional[TreeNode]) -> bool:
        return valid(index, None, None)
