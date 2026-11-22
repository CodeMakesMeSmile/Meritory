class Solution:
    def leastWalking(self, runners: list[int], lockers: list[int]) -> int:
        # Two walks that cross can always be uncrossed without adding distance, so pair in order
        return sum(abs(person - spot) for person, spot in zip(sorted(runners), sorted(lockers)))
