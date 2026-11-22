class Solution:
    def largestPoster(self, boards: list[int]) -> int:
        best = 0
        # Positions of boards whose heights rise from bottom to top
        rising = []
        for i in range(len(boards) + 1):
            # A height of 0 past the end pops every board still waiting
            height = boards[i] if i < len(boards) else 0
            while rising and boards[rising[-1]] >= height:
                top = rising.pop()
                # The board now under it is the nearest shorter one on the left
                left = rising[-1] if rising else -1
                best = max(best, boards[top] * (i - left - 1))
            rising.append(i)
        return best
