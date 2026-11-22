class Solution:
    def fewestCanoes(self, weights: list[int], limit: int) -> int:
        ordered = sorted(weights)
        light = 0
        heavy = len(ordered) - 1
        canoes = 0
        while light <= heavy:
            # The heaviest camper needs a canoe, and if anyone fits with them, the lightest does
            if ordered[light] + ordered[heavy] <= limit:
                light += 1
            heavy -= 1
            canoes += 1
        return canoes
