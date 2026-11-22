class Solution:
    def canMerge(self, first: str, second: str, tape: str) -> bool:
        n = len(first)
        m = len(second)
        if len(tape) != n + m:
            return False
        # fits[j] says whether the first i letters of first and the first j of second make the tape's first i + j
        fits = [False] * (m + 1)
        for i in range(n + 1):
            for j in range(m + 1):
                if i == 0 and j == 0:
                    fits[0] = True
                    continue
                letter = tape[i + j - 1]
                # Before this update, fits[j] is still the answer with one less letter of first
                from_first = i > 0 and fits[j] and first[i - 1] == letter
                # fits[j - 1] is already this row's, the answer with one less letter of second
                from_second = j > 0 and fits[j - 1] and second[j - 1] == letter
                fits[j] = from_first or from_second
        return fits[m]
