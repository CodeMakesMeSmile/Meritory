import java.util.Arrays;

class Solution {
    public int[] runProgram(String[] steps) {
        // Each step pushes at most one value, so the stack never outgrows the program
        int[] stack = new int[steps.length];
        int top = 0;
        for (String step : steps) {
            if (step.equals("add") || step.equals("sub") || step.equals("mul")) {
                // The top value is the right side
                int right = stack[--top];
                int left = stack[--top];
                if (step.equals("add")) stack[top++] = left + right;
                else if (step.equals("sub")) stack[top++] = left - right;
                else stack[top++] = left * right;
            } else if (step.equals("dup")) {
                stack[top] = stack[top - 1];
                top++;
            } else if (step.equals("swap")) {
                int held = stack[top - 1];
                stack[top - 1] = stack[top - 2];
                stack[top - 2] = held;
            } else if (step.equals("drop")) {
                top--;
            } else {
                stack[top++] = Integer.parseInt(step);
            }
        }
        return Arrays.copyOf(stack, top);
    }
}
