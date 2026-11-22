class Solution:
    def leastWaiting(self, repairs: list[int]) -> int:
        clock = 0
        total = 0
        # A longer repair just before a shorter one is always worth swapping, so go shortest first
        for minutes in sorted(repairs):
            # Each customer waits until their own repair is done
            clock += minutes
            total += clock
        return total
