class Solution:
    def bothFree(self, first: list[list[int]], second: list[list[int]]) -> list[list[int]]:
        both = []
        i = j = 0
        while i < len(first) and j < len(second):
            # The two current free times share from the later start to the earlier end
            start = max(first[i][0], second[j][0])
            end = min(first[i][1], second[j][1])
            if start < end:
                both.append([start, end])
            # Whichever ends first can't share time with anything later in the other list
            if first[i][1] < second[j][1]:
                i += 1
            else:
                j += 1
        return both
