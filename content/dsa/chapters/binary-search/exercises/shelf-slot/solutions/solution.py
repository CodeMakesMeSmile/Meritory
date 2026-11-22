class Solution:
    def shelfSlot(self, ids: list[int], newId: int) -> int:
        # Every position before lo holds a smaller number, and every one from hi on holds newId or more
        lo = 0
        hi = len(ids)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if ids[mid] >= newId:
                hi = mid
            else:
                lo = mid + 1
        return lo
