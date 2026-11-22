class Solution:
    def sharedStart(self, names: list[str]) -> str:
        first = names[0]
        # Check one column at a time, and stop where a name runs out or a letter differs
        for at, letter in enumerate(first):
            for name in names:
                if at == len(name) or name[at] != letter:
                    return first[:at]
        return first
