class Solution:
    def hiddenRearrangements(self, text: str, word: str) -> list[int]:
        need = [0] * 26
        have = [0] * 26
        for letter in word:
            need[ord(letter) - 97] += 1
        # How many of the 26 letters have exactly the count the word needs
        matched = need.count(0)

        def change(letter: int, by: int) -> None:
            nonlocal matched
            if have[letter] == need[letter]:
                matched -= 1
            have[letter] += by
            if have[letter] == need[letter]:
                matched += 1

        starts = []
        size = len(word)
        for right in range(len(text)):
            change(ord(text[right]) - 97, 1)
            if right >= size:
                change(ord(text[right - size]) - 97, -1)
            if right >= size - 1 and matched == 26:
                starts.append(right - size + 1)
        return starts
