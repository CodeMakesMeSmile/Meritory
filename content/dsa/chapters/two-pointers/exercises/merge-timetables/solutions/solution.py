class Solution:
    def mergeTimetables(self, first: list[int], second: list[int]) -> list[int]:
        merged = []
        i = j = 0
        while i < len(first) and j < len(second):
            if first[i] <= second[j]:
                merged.append(first[i])
                i += 1
            else:
                merged.append(second[j])
                j += 1
        # One list has run out, so the rest of the other is already in order
        merged.extend(first[i:])
        merged.extend(second[j:])
        return merged
