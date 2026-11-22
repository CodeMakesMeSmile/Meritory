class Solution:
    def canReachLast(self, charge: list[int]) -> bool:
        # The farthest post any post so far can reach
        farthest = 0
        for i, reach in enumerate(charge):
            # No earlier post reaches this one, so nothing past it can be reached either
            if i > farthest:
                return False
            farthest = max(farthest, i + reach)
        return True
