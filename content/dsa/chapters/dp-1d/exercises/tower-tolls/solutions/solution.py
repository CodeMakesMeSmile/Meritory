class Solution:
    def cheapestClimb(self, tolls: list[int]) -> int:
        # The least paid to stand on the landing two below and the landing one below
        before, last = tolls[0], tolls[1]
        for toll in tolls[2:]:
            # Reach this landing from one or two landings below, then pay its toll
            before, last = last, toll + min(before, last)
        # The roof can be reached from either of the top two landings
        return min(before, last)
