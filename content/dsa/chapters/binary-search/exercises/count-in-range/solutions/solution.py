def first_at_least(readings: list[int], target: int) -> int:
    lo = 0
    hi = len(readings)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if readings[mid] >= target:
            hi = mid
        else:
            lo = mid + 1
    return lo


class Solution:
    def countBetween(self, readings: list[int], low: int, high: int) -> int:
        if low > high:
            return 0
        # Readings in range run from the first at least low to just before the first above high
        return first_at_least(readings, high + 1) - first_at_least(readings, low)
