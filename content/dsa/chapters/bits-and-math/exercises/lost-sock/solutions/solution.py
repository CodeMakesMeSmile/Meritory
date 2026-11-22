class Solution:
    def loneSock(self, socks: list[int]) -> int:
        # Each pair XORs to 0, so only the lone pattern is left
        lone = 0
        for sock in socks:
            lone ^= sock
        return lone
