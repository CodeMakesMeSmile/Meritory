class Solution:
    def sharedAirtime(self, first: list[list[int]], second: list[list[int]]) -> int:
        total = 0
        i = j = 0
        while i < len(first) and j < len(second):
            # The two current broadcasts share from the later start to the earlier end
            start = max(first[i][0], second[j][0])
            end = min(first[i][1], second[j][1])
            if start < end:
                total += end - start
            # Whichever ends first can't share time with anything later in the other log
            if first[i][1] < second[j][1]:
                i += 1
            else:
                j += 1
        return total
