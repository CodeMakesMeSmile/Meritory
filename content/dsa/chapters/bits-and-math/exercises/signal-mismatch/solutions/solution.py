class Solution:
    def mismatchedBits(self, first: int, second: int) -> int:
        # A bit of the XOR is 1 exactly where the readings differ, and the mask keeps 32 bits
        diff = (first ^ second) & 0xFFFFFFFF
        count = 0
        while diff:
            # Clears the lowest set bit
            diff &= diff - 1
            count += 1
        return count
