class Solution:
    def shiftGroups(self, codes: list[str]) -> list[list[str]]:
        groups = {}
        for code in codes:
            # The gaps between neighbouring letters survive any shift
            key = (len(code),) + tuple(
                (ord(b) - ord(a)) % 26 for a, b in zip(code, code[1:])
            )
            groups.setdefault(key, []).append(code)
        return list(groups.values())
