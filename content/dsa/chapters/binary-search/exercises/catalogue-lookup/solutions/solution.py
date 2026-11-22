class Solution:
    def inCatalogue(self, grid: list[list[int]], target: int) -> bool:
        cols = len(grid[0])
        size = len(grid) * cols

        def at(i: int) -> int:
            # Position i in reading order is in row i // cols, column i % cols
            return grid[i // cols][i % cols]

        lo = 0
        hi = size
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if at(mid) >= target:
                hi = mid
            else:
                lo = mid + 1
        return lo < size and at(lo) == target
