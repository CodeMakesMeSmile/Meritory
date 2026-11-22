class Solution:
    def bestRun(self, profit: list[int]) -> int:
        # The best total of a run that ends on the current day, and the best seen anywhere
        here = best = profit[0]
        for amount in profit[1:]:
            # A run that adds up to less than zero only drags this day down, so start again
            here = max(amount, here + amount)
            best = max(best, here)
        return best
