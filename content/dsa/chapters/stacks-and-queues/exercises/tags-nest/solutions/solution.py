class Solution:
    def firstBadTag(self, tags: list[str]) -> int:
        open_tags = []
        for i, tag in enumerate(tags):
            if not tag.startswith("/"):
                open_tags.append(tag)
            elif not open_tags or open_tags.pop() != tag[1:]:
                # Nothing was open, or the newest open tag has another name
                return i
        return len(tags) if open_tags else -1
