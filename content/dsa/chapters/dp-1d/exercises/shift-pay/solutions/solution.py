class Solution:
    def bestShiftPay(self, pay: list[int]) -> int:
        # The best pay from every shift but the last one seen, and from all of them
        before, best = 0, 0
        for amount in pay:
            # Skip this shift, or take it on top of the best from two shifts back
            before, best = best, max(best, before + amount)
        return best
