class Solution:
    def rumourReach(self, n: int, tells: list[list[int]], start: int) -> int:
        # News only goes one way, so each pair is listed under the teller alone
        tells_to = [[] for _ in range(n)]
        for teller, hearer in tells:
            tells_to[teller].append(hearer)
        heard = [False] * n
        heard[start] = True
        count = 1
        # Our own stack instead of recursion, since the news can pass along a chain of everyone
        stack = [start]
        while stack:
            at = stack.pop()
            for nxt in tells_to[at]:
                if not heard[nxt]:
                    heard[nxt] = True
                    count += 1
                    stack.append(nxt)
        return count
