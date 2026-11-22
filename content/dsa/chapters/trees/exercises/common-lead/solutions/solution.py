from typing import Optional


# Returns a, b, or their closest shared lead, whichever this branch turns up, or None
def lowest(node: Optional[TreeNode], a: int, b: int) -> Optional[TreeNode]:
    if not node or node.val == a or node.val == b:
        return node
    left = lowest(node.left, a, b)
    right = lowest(node.right, a, b)
    # One found on each side means their paths split here
    if left and right:
        return node
    return left if left else right


class Solution:
    def commonLead(self, team: Optional[TreeNode], a: int, b: int) -> int:
        return lowest(team, a, b).val
