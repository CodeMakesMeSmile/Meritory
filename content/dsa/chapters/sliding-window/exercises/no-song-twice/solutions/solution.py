class Solution:
    def noSongTwice(self, songs: list[int]) -> int:
        last_seen = {}
        longest = 0
        left = 0
        for right, song in enumerate(songs):
            # A last play from before the window isn't a repeat, so left never moves back
            if song in last_seen:
                left = max(left, last_seen[song] + 1)
            last_seen[song] = right
            longest = max(longest, right - left + 1)
        return longest
