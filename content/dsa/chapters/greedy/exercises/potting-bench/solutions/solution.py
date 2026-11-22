class Solution:
    def mostPotted(self, seedlings: list[int], pots: list[int]) -> int:
        needs = sorted(seedlings)
        potted = 0
        for size in sorted(pots):
            # The smallest seedling still waiting takes the smallest pot that fits it
            if potted < len(needs) and size >= needs[potted]:
                potted += 1
        return potted
