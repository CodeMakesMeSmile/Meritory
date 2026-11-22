class Solution:
    def longestRise(self, heights: list[int]) -> int:
        # tails[k] is the lowest height that can end a rise of k + 1 points
        tails = []
        for height in heights:
            # Find the first tail that's at least this height
            lo, hi = 0, len(tails)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if tails[mid] >= height:
                    hi = mid
                else:
                    lo = mid + 1
            # Extend the longest rise, or give a rise of length lo + 1 a lower end
            if lo == len(tails):
                tails.append(height)
            else:
                tails[lo] = height
        return len(tails)
