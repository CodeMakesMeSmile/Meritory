class Solution:
    def freeOnBoth(self, first: list[int], second: list[int]) -> list[int]:
        shared = []
        i = j = 0
        while i < len(first) and j < len(second):
            if first[i] < second[j]:
                i += 1
            elif first[i] > second[j]:
                j += 1
            else:
                # Repeats sit side by side, so only add a day the answer doesn't end with
                if not shared or shared[-1] != first[i]:
                    shared.append(first[i])
                i += 1
                j += 1
        return shared
