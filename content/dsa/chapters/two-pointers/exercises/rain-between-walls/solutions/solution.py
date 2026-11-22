class Solution:
    def rainBetweenWalls(self, walls: list[int]) -> int:
        water = 0
        left, right = 0, len(walls) - 1
        tallest_left = tallest_right = 0
        while left < right:
            tallest_left = max(tallest_left, walls[left])
            tallest_right = max(tallest_right, walls[right])
            # The other side already has a taller wall, so the lower one sets the level
            if tallest_left < tallest_right:
                water += tallest_left - walls[left]
                left += 1
            else:
                water += tallest_right - walls[right]
                right -= 1
        return water
