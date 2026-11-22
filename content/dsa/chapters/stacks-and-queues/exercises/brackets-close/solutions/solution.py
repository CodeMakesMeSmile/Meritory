class Solution:
    def bracketsClose(self, text: str) -> bool:
        partner = {")": "(", "]": "[", "}": "{"}
        open_marks = []
        for char in text:
            if char in "([{":
                open_marks.append(char)
            elif char in partner:
                # Only the newest open bracket is allowed to close here
                if not open_marks or open_marks.pop() != partner[char]:
                    return False
        return not open_marks
