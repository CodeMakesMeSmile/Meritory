MOD = 1_000_000_007


class Solution:
    def hopWays(self, distance: int, hops: list[int]) -> int:
        # ways[d] is the number of jump sequences that land exactly on square d
        ways = [0] * (distance + 1)
        ways[0] = 1
        for d in range(1, distance + 1):
            for hop in hops:
                # The last jump could have been any length that fits
                if hop <= d:
                    ways[d] = (ways[d] + ways[d - hop]) % MOD
        return ways[distance]
