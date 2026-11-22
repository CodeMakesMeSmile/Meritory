class Solution:
    def oldestEntry(self, totals: list[int]) -> int:
        last = totals[-1]
        # Every slot before lo holds more than the last slot, and every one from hi on holds no more
        lo = 0
        hi = len(totals)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if totals[mid] <= last:
                hi = mid
            else:
                lo = mid + 1
        return lo
