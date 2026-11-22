class Solution:
    def postfixTotal(self, tokens: list[str]) -> int:
        values = []
        for token in tokens:
            if token in ("+", "-", "*", "/"):
                # The value pushed last is the right side
                right = values.pop()
                left = values.pop()
                if token == "+":
                    values.append(left + right)
                elif token == "-":
                    values.append(left - right)
                elif token == "*":
                    values.append(left * right)
                else:
                    # Python's // rounds down, so divide the sizes and put the sign back
                    quotient = abs(left) // abs(right)
                    values.append(-quotient if (left < 0) != (right < 0) else quotient)
            else:
                values.append(int(token))
        return values[0]
