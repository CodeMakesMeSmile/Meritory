class Solution:
    def runProgram(self, steps: list[str]) -> list[int]:
        stack = []
        for step in steps:
            if step in ("add", "sub", "mul"):
                # The top value is the right side
                right = stack.pop()
                left = stack.pop()
                if step == "add":
                    stack.append(left + right)
                elif step == "sub":
                    stack.append(left - right)
                else:
                    stack.append(left * right)
            elif step == "dup":
                stack.append(stack[-1])
            elif step == "swap":
                stack[-1], stack[-2] = stack[-2], stack[-1]
            elif step == "drop":
                stack.pop()
            else:
                stack.append(int(step))
        return stack
