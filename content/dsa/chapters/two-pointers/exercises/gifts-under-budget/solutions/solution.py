class Solution:
    def giftsUnderBudget(self, prices: list[int], budget: int) -> int:
        best = -1
        left, right = 0, len(prices) - 1
        while left < right:
            total = prices[left] + prices[right]
            if total <= budget:
                # This is the best the left gift can do, so record it and move on
                best = max(best, total)
                left += 1
            else:
                right -= 1
        return best
