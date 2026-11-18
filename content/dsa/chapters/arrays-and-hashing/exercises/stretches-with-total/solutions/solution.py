class Solution:
    def stretchesWithTotal(self, changes: list[int], total: int) -> int:
        seen = {0: 1}
        running = 0
        stretches = 0
        for change in changes:
            running += change
            stretches += seen.get(running - total, 0)
            seen[running] = seen.get(running, 0) + 1
        return stretches
