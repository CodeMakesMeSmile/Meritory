from math import isqrt


class Solution:
    def primeLockers(self, lockers: int) -> int:
        if lockers < 2:
            return 0
        prime = bytearray([1]) * (lockers + 1)
        prime[0] = prime[1] = 0
        for p in range(2, isqrt(lockers) + 1):
            if prime[p]:
                # Smaller multiples of p were already crossed off by smaller primes
                prime[p * p :: p] = bytes(len(range(p * p, lockers + 1, p)))
        return sum(prime)
