class Solution:
    def evenStretch(self, games: list[bool]) -> int:
        # Wins minus losses so far, mapped to the first game index where it happened
        first_index = {0: -1}
        balance = 0
        longest = 0
        for i, won in enumerate(games):
            balance += 1 if won else -1
            if balance in first_index:
                longest = max(longest, i - first_index[balance])
            else:
                first_index[balance] = i
        return longest
