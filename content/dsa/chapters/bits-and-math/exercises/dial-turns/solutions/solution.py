class Solution:
    def dialPosition(self, factor: int, turns: int, size: int) -> int:
        # The built-in pow(factor, turns, size) does the same, and this is the loop behind it
        position = 1 % size
        square = factor % size
        while turns > 0:
            if turns & 1:
                position = position * square % size
            square = square * square % size
            turns >>= 1
        return position
