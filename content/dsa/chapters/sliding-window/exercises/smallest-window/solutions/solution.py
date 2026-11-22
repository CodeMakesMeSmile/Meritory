class Solution:
    def smallestWindow(self, text: str, needed: str) -> str:
        # How many more of each letter the window needs, below 0 when it has spare
        need = [0] * 26
        for letter in needed:
            need[ord(letter) - 97] += 1
        missing = len(needed)
        best_start = 0
        best_length = 0
        left = 0
        for right in range(len(text)):
            entering = ord(text[right]) - 97
            if need[entering] > 0:
                missing -= 1
            need[entering] -= 1
            while missing == 0:
                # Only a strictly shorter stretch replaces one that starts earlier
                length = right - left + 1
                if best_length == 0 or length < best_length:
                    best_start = left
                    best_length = length
                leaving = ord(text[left]) - 97
                need[leaving] += 1
                if need[leaving] > 0:
                    missing += 1
                left += 1
        return text[best_start : best_start + best_length]
