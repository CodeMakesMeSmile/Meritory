class Solution:
    def bestLoopStretch(self, views: list[int]) -> int:
        total = views[0]
        # The best and worst totals of a stretch ending at the current point, and of any stretch
        best_here = best = views[0]
        worst_here = worst = views[0]
        for score in views[1:]:
            total += score
            best_here = max(score, best_here + score)
            best = max(best, best_here)
            worst_here = min(score, worst_here + score)
            worst = min(worst, worst_here)
        # Every score is negative, so leaving out the worst stretch would leave nothing
        if best < 0:
            return best
        # A stretch that wraps is the whole loop without one stretch in the middle
        return max(best, total - worst)
