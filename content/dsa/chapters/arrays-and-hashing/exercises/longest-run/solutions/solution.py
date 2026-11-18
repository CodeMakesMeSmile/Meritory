class Solution:
    def longestRun(self, days: list[int]) -> int:
        done = set(days)
        longest = 0
        for day in done:
            if day - 1 in done:
                continue
            length = 1
            while day + length in done:
                length += 1
            longest = max(longest, length)
        return longest
