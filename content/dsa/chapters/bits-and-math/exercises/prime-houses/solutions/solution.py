from math import isqrt


class Solution:
    def primeHouses(self, low: int, high: int) -> int:
        # Every composite in the window has a prime factor no bigger than this
        root = isqrt(high)
        small = bytearray([1]) * (root + 1)
        primes = []
        for p in range(2, root + 1):
            if small[p]:
                primes.append(p)
                small[p * p :: p] = bytes(len(range(p * p, root + 1, p)))
        # window[i] stays 1 while low + i might be prime
        window = bytearray([1]) * (high - low + 1)
        for p in primes:
            # Start at p squared, or at the first multiple of p in the window
            start = max(p * p, (low + p - 1) // p * p)
            if start <= high:
                window[start - low :: p] = bytes(len(range(start, high + 1, p)))
        # 1 isn't prime, though nothing crosses it off
        if low == 1:
            window[0] = 0
        return sum(window)
