MOD = 1_000_000_007


class Solution:
    def songCount(self, calls: str, song: str) -> int:
        m = len(song)
        # ways[j] counts the ways to spell the first j notes of song from the calls so far
        ways = [0] * (m + 1)
        ways[0] = 1
        for call in calls:
            # Going down keeps ways[j - 1] from before this call, so each call is used once
            for j in range(m, 0, -1):
                if song[j - 1] == call:
                    ways[j] = (ways[j] + ways[j - 1]) % MOD
        return ways[m]
