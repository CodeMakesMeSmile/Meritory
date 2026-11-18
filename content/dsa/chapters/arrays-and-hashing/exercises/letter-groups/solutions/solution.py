class Solution:
    def letterGroups(self, words: list[str]) -> list[list[str]]:
        # A dict keeps groups in the order their first word was added
        groups = {}
        for word in words:
            groups.setdefault("".join(sorted(word)), []).append(word)
        return list(groups.values())
