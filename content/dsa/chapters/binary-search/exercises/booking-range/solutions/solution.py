def first_at_least(days: list[int], target: int) -> int:
    lo = 0
    hi = len(days)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if days[mid] >= target:
            hi = mid
        else:
            lo = mid + 1
    return lo


class Solution:
    def bookingRange(self, days: list[int], day: int) -> list[int]:
        start = first_at_least(days, day)
        if start == len(days) or days[start] != day:
            return [-1, -1]
        # The first booking on a later day sits just past the last booking on this one
        end = first_at_least(days, day + 1)
        return [start, end - 1]
