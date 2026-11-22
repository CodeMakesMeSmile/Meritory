class Solution:
    def busMeetup(self, gaps: list[int]) -> int:
        def gcd(a: int, b: int) -> int:
            while b:
                a, b = b, a % b
            return a

        meet = 1
        for gap in gaps:
            # Divide before multiplying, the same habit the 64-bit languages need
            meet = meet // gcd(meet, gap) * gap
        return meet
