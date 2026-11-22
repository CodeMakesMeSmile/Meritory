class Solution:
    def firstFailing(self, builds: list[bool]) -> int:
        # Every build before lo passed, and every build from hi on failed
        lo = 0
        hi = len(builds)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if not builds[mid]:
                hi = mid
            else:
                lo = mid + 1
        return lo
