class Solution:
    def lastDigits(self, base: int, exponent: int, digits: int) -> int:
        m = 10**digits
        result = 1
        square = base % m
        # Read the exponent's bits from the lowest, squaring as we go
        while exponent > 0:
            if exponent & 1:
                result = result * square % m
            square = square * square % m
            exponent >>= 1
        return result % m
