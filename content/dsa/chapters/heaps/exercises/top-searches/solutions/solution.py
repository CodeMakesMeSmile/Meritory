import heapq
from collections import Counter


class Solution:
    def topSearches(self, searches: list[str], k: int) -> list[str]:
        counts = Counter(searches)
        # nsmallest keeps a heap of size k, and the key puts more searches first, then the alphabet
        return heapq.nsmallest(k, counts, key=lambda word: (-counts[word], word))
