class Solution:
    def rainyStretches(self, rainy: list[bool], k: int) -> int:
        return self.at_most(rainy, k) - self.at_most(rainy, k - 1)

    def at_most(self, rainy: list[bool], k: int) -> int:
        if k < 0:
            return 0
        wet = 0
        stretches = 0
        left = 0
        for right in range(len(rainy)):
            if rainy[right]:
                wet += 1
            while wet > k:
                if rainy[left]:
                    wet -= 1
                left += 1
            # Every start from left to right gives a stretch with at most k rainy days
            stretches += right - left + 1
        return stretches
