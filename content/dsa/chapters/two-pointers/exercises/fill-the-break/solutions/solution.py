class Solution:
    def fillTheBreak(self, lengths: list[int], target: int) -> list[int]:
        left, right = 0, len(lengths) - 1
        while left < right:
            total = lengths[left] + lengths[right]
            if total == target:
                return [left, right]
            # A short total means no partner still in play is long enough for the left song
            if total < target:
                left += 1
            else:
                right -= 1
        return []
