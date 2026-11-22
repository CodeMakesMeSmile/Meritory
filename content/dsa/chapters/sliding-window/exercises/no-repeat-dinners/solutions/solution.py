class Solution:
    def noRepeatDinners(self, dinners: list[int], k: int) -> int:
        counts = {}
        # How many dishes appear more than once in the window
        repeated = 0
        stretches = 0
        for right, dish in enumerate(dinners):
            counts[dish] = counts.get(dish, 0) + 1
            if counts[dish] == 2:
                repeated += 1
            if right >= k:
                leaving = dinners[right - k]
                counts[leaving] -= 1
                if counts[leaving] == 1:
                    repeated -= 1
            if right >= k - 1 and repeated == 0:
                stretches += 1
        return stretches
