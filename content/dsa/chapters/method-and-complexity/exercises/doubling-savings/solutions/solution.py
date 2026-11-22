class Solution:
    def doublingNights(self, start: int, goal: int) -> int:
        coins = start
        nights = 0
        # Each night doubles the coins, so this runs about log(goal / start) times
        while coins < goal:
            coins *= 2
            nights += 1
        return nights
