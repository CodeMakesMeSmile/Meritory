MOD = 1_000_000_007


class Solution:
    def changeWays(self, coins: list[int], amount: int) -> int:
        # ways[a] counts the sets that make a from the coins handled so far
        ways = [0] * (amount + 1)
        ways[0] = 1
        # Coins in the outer loop build each set in one order, so it's counted once
        for coin in coins:
            for a in range(coin, amount + 1):
                ways[a] = (ways[a] + ways[a - coin]) % MOD
        return ways[amount]
