class Solution:
    def balancedTriples(self, amounts: list[int]) -> list[list[int]]:
        ordered = sorted(amounts)
        found = []
        for i in range(len(ordered) - 2):
            # A repeated first amount would find the same sets again
            if i > 0 and ordered[i] == ordered[i - 1]:
                continue
            left, right = i + 1, len(ordered) - 1
            while left < right:
                total = ordered[i] + ordered[left] + ordered[right]
                if total < 0:
                    left += 1
                elif total > 0:
                    right -= 1
                else:
                    found.append([ordered[i], ordered[left], ordered[right]])
                    left += 1
                    right -= 1
                    while left < right and ordered[left] == ordered[left - 1]:
                        left += 1
        return found
