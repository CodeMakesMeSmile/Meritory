class Solution:
    def biggestSquare(self, tiles: int) -> int:
        # Find the first side whose square needs more than tiles, then step back one
        lo = 0
        hi = tiles + 1
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if mid * mid > tiles:
                hi = mid
            else:
                lo = mid + 1
        return lo - 1
