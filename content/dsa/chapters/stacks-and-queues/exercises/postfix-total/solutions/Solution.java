import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int postfixTotal(String[] tokens) {
        Deque<Integer> values = new ArrayDeque<>();
        for (String token : tokens) {
            if (token.equals("+") || token.equals("-") || token.equals("*") || token.equals("/")) {
                // The value pushed last is the right side
                int right = values.pop();
                int left = values.pop();
                if (token.equals("+")) values.push(left + right);
                else if (token.equals("-")) values.push(left - right);
                else if (token.equals("*")) values.push(left * right);
                else values.push(left / right);
            } else {
                values.push(Integer.parseInt(token));
            }
        }
        return values.pop();
    }
}
