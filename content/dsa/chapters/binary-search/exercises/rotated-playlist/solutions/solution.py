class Solution:
    def findTrack(self, tracks: list[int], target: int) -> int:
        last = tracks[-1]
        # Find where the loop wraps, the first track no higher than the last one
        lo = 0
        hi = len(tracks)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if tracks[mid] <= last:
                hi = mid
            else:
                lo = mid + 1
        wrap = lo
        # Tracks up to the last one sit from wrap to the end, and higher ones sit before it
        if target <= last:
            lo, hi = wrap, len(tracks)
        else:
            lo, hi = 0, wrap
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if tracks[mid] >= target:
                hi = mid
            else:
                lo = mid + 1
        return lo if lo < len(tracks) and tracks[lo] == target else -1
