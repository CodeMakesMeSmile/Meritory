from collections import deque


class Solution:
    def windowHighs(self, prices: list[int], k: int) -> list[int]:
        # Positions whose prices get smaller from front to back
        positions = deque()
        highs = []
        for right, price in enumerate(prices):
            # An older price no higher than this one can never be a high again
            while positions and prices[positions[-1]] <= price:
                positions.pop()
            positions.append(right)
            if positions[0] <= right - k:
                positions.popleft()
            if right >= k - 1:
                highs.append(prices[positions[0]])
        return highs
