class Solution:
    def mirrorSplits(self, word: str) -> list[list[str]]:
        ways = []
        path = []

        def build(start: int) -> None:
            if start == len(word):
                ways.append(path[:])
                return
            for end in range(start, len(word)):
                piece = word[start:end + 1]
                # A piece that doesn't mirror can't be part of any answer
                if piece != piece[::-1]:
                    continue
                path.append(piece)
                build(end + 1)
                path.pop()

        build(0)
        return ways
