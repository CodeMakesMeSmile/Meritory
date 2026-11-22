class Solution:
    def stoneWays(self, stones: int) -> int:
        # Ways to reach the stone two back and the stone one back, starting at stones 0 and 1
        before, last = 1, 1
        for _ in range(2, stones + 1):
            # The last hop came from one stone back or two stones back
            before, last = last, last + before
        return last
