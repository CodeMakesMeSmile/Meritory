class Solution:
    def fewestTerms(self, n: int, prerequisites: list[list[int]]) -> int:
        unlocks = [[] for _ in range(n)]
        # waiting[m] counts the prerequisites module m hasn't had passed yet
        waiting = [0] * n
        for before, after in prerequisites:
            unlocks[before].append(after)
            waiting[after] += 1
        # The first term holds every module with nothing to wait for
        term = [m for m in range(n) if waiting[m] == 0]
        terms = 0
        taken = 0
        while term:
            terms += 1
            taken += len(term)
            next_term = []
            for m in term:
                for after in unlocks[m]:
                    waiting[after] -= 1
                    if waiting[after] == 0:
                        next_term.append(after)
            term = next_term
        # Modules in a circle never get down to 0 waiting, so they're never taken
        return terms if taken == n else -1
