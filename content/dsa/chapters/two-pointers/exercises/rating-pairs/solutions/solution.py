class Solution:
    def ratingPairs(self, ratings: list[int], target: int) -> list[list[int]]:
        ordered = sorted(ratings)
        pairs = []
        left, right = 0, len(ordered) - 1
        while left < right:
            total = ordered[left] + ordered[right]
            if total < target:
                left += 1
            elif total > target:
                right -= 1
            else:
                pairs.append([ordered[left], ordered[right]])
                left += 1
                right -= 1
                # Copies of the rating just used would make the same pair again
                while left < right and ordered[left] == ordered[left - 1]:
                    left += 1
        return pairs
