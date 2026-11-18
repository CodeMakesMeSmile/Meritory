class Solution:
    def asRanges(self, ids: list[int]) -> list[list[int]]:
        present = set(ids)
        ranges = []
        for start in present:
            if start - 1 in present:
                continue
            end = start
            while end + 1 in present:
                end += 1
            ranges.append([start, end])
        return ranges
