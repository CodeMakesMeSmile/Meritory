MOD = 1_000_000_007


class Solution:
    def cultureSize(self, factor: int, hours: int) -> int:
        # The count after h hours is the count after half as many hours, squared
        def grow(h: int) -> int:
            if h == 0:
                return 1
            half = grow(h // 2)
            squared = half * half % MOD
            # An odd number of hours needs one more split
            return squared if h % 2 == 0 else squared * factor % MOD

        return grow(hours)
