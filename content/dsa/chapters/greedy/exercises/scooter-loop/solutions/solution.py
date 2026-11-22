class Solution:
    def firstStart(self, charge: list[int], drain: list[int]) -> int:
        total = 0
        battery = 0
        start = 0
        for i, (gain, use) in enumerate(zip(charge, drain)):
            total += gain - use
            battery += gain - use
            # Ran out before the next dock, so no dock from start to here works either
            if battery < 0:
                start = i + 1
                battery = 0
        # With enough charge round the whole loop, the last start never runs out
        return start if total >= 0 else -1
