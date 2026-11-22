class Solution:
    def knockoutRounds(self, players: int) -> int:
        rounds = 0
        while players > 1:
            # Half the players lose, rounded down, and the rest go through
            players -= players // 2
            rounds += 1
        return rounds
