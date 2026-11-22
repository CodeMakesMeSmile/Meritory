class Solution:
    def moveCrates(self, count: int, start: int, goal: int) -> list[list[int]]:
        moves = []

        # Moves the top n crates from one bay to another, using the third as a spare
        def move(n: int, source: int, target: int) -> None:
            if n == 0:
                return
            # The bays add up to 6, so the spare is what's left
            spare = 6 - source - target
            move(n - 1, source, spare)
            moves.append([source, target])
            move(n - 1, spare, target)

        move(count, start, goal)
        return moves
