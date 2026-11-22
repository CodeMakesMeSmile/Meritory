class Solution:
    def bracketPatterns(self, pairs: int) -> list[str]:
        patterns = []
        path = []

        def build(opened: int, closed: int) -> None:
            if closed == pairs:
                patterns.append("".join(path))
                return
            # Open another pair only while some are left to open
            if opened < pairs:
                path.append("(")
                build(opened + 1, closed)
                path.pop()
            # Close only when something is open, so the string never goes wrong
            if closed < opened:
                path.append(")")
                build(opened, closed + 1)
                path.pop()

        build(0, 0)
        return patterns
