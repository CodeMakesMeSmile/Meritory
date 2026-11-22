class Solution:
    def slowestPace(self, chapters: list[int], hours: int) -> int:
        def hours_at(pace: int) -> int:
            # Hours a pace needs, one chapter at a time
            return sum((pages + pace - 1) // pace for pages in chapters)

        # Every pace before lo is too slow, and every pace from hi on finishes in time
        lo = 1
        hi = max(chapters)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if hours_at(mid) <= hours:
                hi = mid
            else:
                lo = mid + 1
        return lo
