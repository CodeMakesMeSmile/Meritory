class Solution:
    def largestTile(self, width: int, length: int) -> int:
        a, b = width, length
        # Euclid's algorithm: the gcd of a and b is the gcd of b and a % b
        while b:
            a, b = b, a % b
        return a
