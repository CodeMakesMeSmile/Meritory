class Solution:
    def balancePoint(self, weights: list[int]) -> int:
        right = sum(weights)
        left = 0
        for i, weight in enumerate(weights):
            right -= weight
            if left == right:
                return i
            left += weight
        return -1
