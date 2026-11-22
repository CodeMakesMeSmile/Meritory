class Solution:
    def fewestRelays(self, power: list[int]) -> int:
        last = len(power) - 1
        relays = 0
        # Every tower up to round_end can get the message in this many relays
        round_end = 0
        # The farthest tower one more relay can reach
        farthest = 0
        for i in range(last):
            farthest = max(farthest, i + power[i])
            if i == round_end:
                # No tower in this round sends any further, so the message is stuck
                if farthest <= i:
                    return -1
                relays += 1
                round_end = farthest
                if round_end >= last:
                    break
        return relays
