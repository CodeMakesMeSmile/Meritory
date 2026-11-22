from collections import deque


class Solution:
    def steadyStretch(self, temperatures: list[int], limit: int) -> int:
        # Positions with readings falling from front to back, so the front is the highest
        highs = deque()
        # Positions with readings rising from front to back, so the front is the lowest
        lows = deque()
        longest = 0
        left = 0
        for right, reading in enumerate(temperatures):
            while highs and temperatures[highs[-1]] <= reading:
                highs.pop()
            highs.append(right)
            while lows and temperatures[lows[-1]] >= reading:
                lows.pop()
            lows.append(right)
            # Shrink until the highest and lowest readings are close enough
            while temperatures[highs[0]] - temperatures[lows[0]] > limit:
                left += 1
                if highs[0] < left:
                    highs.popleft()
                if lows[0] < left:
                    lows.popleft()
            longest = max(longest, right - left + 1)
        return longest
