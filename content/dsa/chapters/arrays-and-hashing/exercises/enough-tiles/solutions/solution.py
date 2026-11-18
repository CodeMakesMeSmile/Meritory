class Solution:
    def enoughTiles(self, word: str, tiles: str) -> bool:
        counts = [0] * 26
        for tile in tiles:
            counts[ord(tile) - ord("a")] += 1
        for letter in word:
            index = ord(letter) - ord("a")
            if counts[index] == 0:
                return False
            counts[index] -= 1
        return True
