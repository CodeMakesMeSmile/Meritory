class Solution:
    def kthLowest(self, heights: list[list[int]], k: int) -> int:
        rows = len(heights)
        cols = len(heights[0])

        def count_at_most(limit: int) -> int:
            # Walks left from the top right as the rows go down
            count = 0
            col = cols - 1
            for row in range(rows):
                while col >= 0 and heights[row][col] > limit:
                    col -= 1
                count += col + 1
            return count

        # Every height before lo has fewer than k at or below it, and every one from hi on has k or more
        lo = heights[0][0]
        hi = heights[rows - 1][cols - 1]
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if count_at_most(mid) >= k:
                hi = mid
            else:
                lo = mid + 1
        return lo
