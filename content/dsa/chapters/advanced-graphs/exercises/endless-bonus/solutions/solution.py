class Solution:
    def hasEndlessBonus(self, n: int, doors: list[list[int]], start: int) -> bool:
        # coins[room] is the least the player has paid to reach that room so far
        inf = float("inf")
        coins = [inf] * n
        coins[start] = 0
        # n - 1 rounds settle every cheapest path, unless a loop keeps paying
        for _ in range(n - 1):
            changed = False
            for room, nxt, toll in doors:
                # A room the player can't reach yet can't make anything cheaper
                if coins[room] != inf and coins[room] + toll < coins[nxt]:
                    coins[nxt] = coins[room] + toll
                    changed = True
            # Nothing moved, so nothing ever will, and no paying loop is in reach
            if not changed:
                return False
        # One more round: a room that still gets cheaper is fed by a paying loop
        return any(coins[room] != inf and coins[room] + toll < coins[nxt] for room, nxt, toll in doors)
