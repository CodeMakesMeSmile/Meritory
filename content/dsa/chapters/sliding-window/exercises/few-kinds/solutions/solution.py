class Solution:
    def fewKinds(self, jars: list[int], k: int) -> int:
        counts = {}
        longest = 0
        left = 0
        for right, jar in enumerate(jars):
            counts[jar] = counts.get(jar, 0) + 1
            # The dict holds only kinds still in the window, so its size is the kinds
            while len(counts) > k:
                counts[jars[left]] -= 1
                if counts[jars[left]] == 0:
                    del counts[jars[left]]
                left += 1
            longest = max(longest, right - left + 1)
        return longest
