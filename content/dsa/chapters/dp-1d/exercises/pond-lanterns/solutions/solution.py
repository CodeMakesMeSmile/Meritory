# The most brightness from glow[start] to glow[end - 1] in a straight row
def best_in_row(glow: list[int], start: int, end: int) -> int:
    before, best = 0, 0
    for i in range(start, end):
        before, best = best, max(best, before + glow[i])
    return best


class Solution:
    def brightestRing(self, glow: list[int]) -> int:
        if len(glow) == 1:
            return glow[0]
        # The first and last are neighbours, so leave out one of them each time
        return max(best_in_row(glow, 0, len(glow) - 1), best_in_row(glow, 1, len(glow)))
