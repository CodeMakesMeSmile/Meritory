class Solution:
    def sameLetters(self, first: str, second: str) -> bool:
        if len(first) != len(second):
            return False
        counts = [0] * 26
        for a, b in zip(first, second):
            counts[ord(a) - ord("a")] += 1
            counts[ord(b) - ord("a")] -= 1
        return all(count == 0 for count in counts)
