class Solution:
    def warmStretches(self, temperatures: list[int], k: int, limit: int) -> int:
        # An average of at least limit is a total of at least limit times k
        needed = limit * k
        total = 0
        count = 0
        for right in range(len(temperatures)):
            total += temperatures[right]
            if right >= k:
                total -= temperatures[right - k]
            if right >= k - 1 and total >= needed:
                count += 1
        return count
