class Solution:
    def biggestBanner(self, heights: list[int]) -> int:
        best = 0
        left, right = 0, len(heights) - 1
        while left < right:
            height = min(heights[left], heights[right])
            best = max(best, height * (right - left))
            # Any closer partner for the shorter post makes a smaller banner
            if heights[left] < heights[right]:
                left += 1
            else:
                right -= 1
        return best
