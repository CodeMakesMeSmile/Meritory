class Solution:
    def fewestDays(self, savings: list[int], goal: int) -> int:
        fewest = 0
        total = 0
        left = 0
        for right, saved in enumerate(savings):
            total += saved
            # Record while the window still reaches the goal, then try a shorter one
            while total >= goal:
                length = right - left + 1
                if fewest == 0 or length < fewest:
                    fewest = length
                total -= savings[left]
                left += 1
        return fewest
