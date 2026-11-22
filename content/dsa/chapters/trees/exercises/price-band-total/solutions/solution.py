from typing import Optional


class Solution:
    def bandTotal(self, prices: Optional[TreeNode], low: int, high: int) -> int:
        if not prices:
            return 0
        # Everything on the left is lower still, so only the right can be in the band
        if prices.val < low:
            return self.bandTotal(prices.right, low, high)
        # Everything on the right is higher still, so only the left can be in the band
        if prices.val > high:
            return self.bandTotal(prices.left, low, high)
        return (
            prices.val
            + self.bandTotal(prices.left, low, high)
            + self.bandTotal(prices.right, low, high)
        )
